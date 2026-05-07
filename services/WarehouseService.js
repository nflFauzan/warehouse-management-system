const { WarehouseLayout, WarehouseSlot, StockPosition, PositionMovement, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

class WarehouseService {
  async getActiveLayout() {
    return await WarehouseLayout.findOne({
      where: { is_active: true },
      include: [{
        model: WarehouseSlot,
        as: 'slots',
        include: [{
          model: StockPosition,
          as: 'positions',
          include: [{ model: Item, as: 'item' }]
        }]
      }]
    });
  }

  async saveLayout(data) {
    const t = await sequelize.transaction();
    try {
      const { id, name, rows, cols, slots } = data;
      let layout;

      if (id) {
        layout = await WarehouseLayout.findByPk(id, { transaction: t });
        await layout.update({ name, rows, cols }, { transaction: t });
      } else {
        layout = await WarehouseLayout.create({ name, rows, cols, is_active: true }, { transaction: t });
      }

      // Sync slots
      const existingSlots = await WarehouseSlot.findAll({ where: { layout_id: layout.id }, transaction: t });
      const slotIdsToKeep = slots.filter(s => s.id).map(s => s.id);

      // Remove slots not in the new list
      for (const slot of existingSlots) {
        if (!slotIdsToKeep.includes(slot.id)) {
          // Check if slot has stock before deleting
          const stock = await StockPosition.findOne({ where: { slot_id: slot.id, quantity: { [Op.gt]: 0 } }, transaction: t });
          if (stock) throw new Error(`Slot ${slot.name} cannot be deleted because it contains stock.`);
          await slot.destroy({ transaction: t });
        }
      }

      // Add or update slots
      for (const s of slots) {
        if (s.id) {
          const slot = await WarehouseSlot.findByPk(s.id, { transaction: t });
          await slot.update({
            name: s.name,
            x: s.x,
            y: s.y,
            z: s.z || 0,
            zone: s.zone,
            rack: s.rack,
            section: s.section,
            capacity: s.capacity || 0
          }, { transaction: t });
        } else {
          await WarehouseSlot.create({
            layout_id: layout.id,
            name: s.name,
            x: s.x,
            y: s.y,
            z: s.z || 0,
            zone: s.zone,
            rack: s.rack,
            section: s.section,
            capacity: s.capacity || 0
          }, { transaction: t });
        }
      }

      await t.commit();
      return layout;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async moveStock(data, userId) {
    const t = await sequelize.transaction();
    try {
      const { item_id, from_slot_id, to_slot_id, quantity } = data;
      const qty = parseFloat(quantity);

      if (qty <= 0) throw new Error('Quantity must be greater than zero.');
      if (from_slot_id === to_slot_id) throw new Error('Source and destination slots must be different.');

      // Check source stock
      if (from_slot_id) {
        const fromPos = await StockPosition.findOne({
          where: { item_id, slot_id: from_slot_id },
          transaction: t,
          lock: true
        });
        if (!fromPos || parseFloat(fromPos.quantity) < qty) {
          throw new Error('Insufficient stock in source slot.');
        }
        const newQty = parseFloat(fromPos.quantity) - qty;
        if (newQty === 0) {
          await fromPos.destroy({ transaction: t });
        } else {
          await fromPos.update({ quantity: newQty }, { transaction: t });
        }
      } else {
        // Initial placement - check if global stock is enough
        const item = await Item.findByPk(item_id, { transaction: t, lock: true });
        // Calculate current placed stock
        const placedStock = await StockPosition.sum('quantity', { where: { item_id }, transaction: t }) || 0;
        if (parseFloat(item.current_stock) < (parseFloat(placedStock) + qty)) {
          throw new Error('Cannot place more stock than available in global inventory.');
        }
      }

      // Check destination capacity
      const toSlot = await WarehouseSlot.findByPk(to_slot_id, { transaction: t });
      if (!toSlot) throw new Error('Destination slot not found.');
      
      if (parseFloat(toSlot.capacity) > 0) {
        const currentToQty = await StockPosition.sum('quantity', { where: { slot_id: to_slot_id }, transaction: t }) || 0;
        if (parseFloat(currentToQty) + qty > parseFloat(toSlot.capacity)) {
          throw new Error(`Destination slot capacity exceeded. Available: ${parseFloat(toSlot.capacity) - parseFloat(currentToQty)}`);
        }
      }

      // Update destination stock
      let toPos = await StockPosition.findOne({
        where: { item_id, slot_id: to_slot_id },
        transaction: t,
        lock: true
      });

      if (toPos) {
        await toPos.update({ quantity: parseFloat(toPos.quantity) + qty }, { transaction: t });
      } else {
        await StockPosition.create({
          item_id,
          slot_id: to_slot_id,
          quantity: qty
        }, { transaction: t });
      }

      // Record movement
      await PositionMovement.create({
        item_id,
        from_slot_id,
        to_slot_id,
        quantity: qty,
        moved_by: userId,
        notes: data.notes || 'Stock movement'
      }, { transaction: t });

      await t.commit();
      return { success: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async getLayoutSlots() {
    return await WarehouseSlot.findAll({
      order: [['name', 'ASC']]
    });
  }
}

module.exports = new WarehouseService();
