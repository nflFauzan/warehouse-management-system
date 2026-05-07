const { sequelize, Item } = require('../models');
const StockRepository = require('../repositories/StockRepository');
const SupplierService = require('./SupplierService');
const CustomerService = require('./CustomerService');
const ReferenceGenerator = require('../helpers/ReferenceGenerator');

class StockService {
  /**
   * Helper to parse items from form body
   */
  _parseItems(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return Object.keys(raw)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(k => raw[k]);
  }

  // ─── STOCK IN ───────────────────────────────────────
  async getStockInList(query) {
    const { page = 1, search, status } = query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: stockIns } = await StockRepository.findAndCountStockIn({
      search, status, limit, offset
    });

    return {
      stockIns,
      count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }

  async getStockInCreateData() {
    const refNo = await ReferenceGenerator.stockIn();
    const suppliers = await SupplierService.getAllCategories ? [] : (await require('../models').Supplier.findAll({ where: { is_active: true }, order: [['name', 'ASC']] }));
    // Note: SupplierService doesn't have getAll yet, using model directly to maintain logic parity
    const today = new Date().toISOString().split('T')[0];
    return { refNo, suppliers, today };
  }

  async createStockInDraft(data, userId) {
    const t = await sequelize.transaction();
    try {
      const { reference_no, supplier_id, received_at, supplier_ref, notes, items } = data;

      const stockIn = await StockRepository.createStockIn({
        reference_no, supplier_id, received_at,
        supplier_ref: supplier_ref || null,
        notes: notes || null,
        received_by: userId,
        status: 'draft',
      }, t);

      const itemList = this._parseItems(items);
      for (const it of itemList) {
        if (!it.item_id || !it.quantity) continue;
        const product = await Item.findByPk(it.item_id, { transaction: t });
        if (!product) continue;

        const qty = parseFloat(it.quantity);
        const stockBefore = parseFloat(product.current_stock);
        
        await StockRepository.createStockInItem({
          stock_in_id: stockIn.id,
          item_id: it.item_id,
          quantity: qty,
          stock_before: stockBefore,
          stock_after: stockBefore + qty,
        }, t);
      }

      await t.commit();
      return stockIn;
    } catch (err) {
      console.error('DATABASE ERROR IN createStockInDraft:', err);
      await t.rollback();
      throw err;
    }
  }

  async confirmStockIn(id, userId) {
    const t = await sequelize.transaction();
    try {
      const { WarehouseSlot, StockPosition } = require('../models');
      const stockIn = await StockRepository.findStockInById(id, true);
      if (!stockIn) throw new Error('Transaksi tidak ditemukan.');
      if (stockIn.status === 'confirmed') throw new Error('Transaksi sudah dikonfirmasi.');

      // Ensure Receiving Area exists
      let receivingSlot = await WarehouseSlot.findOne({ where: { name: 'RECEIVING' }, transaction: t });
      if (!receivingSlot) {
        // Find any layout to attach to, or create a dummy one if none exists
        let layout = await require('../models').WarehouseLayout.findOne({ transaction: t });
        if (!layout) {
          layout = await require('../models').WarehouseLayout.create({ name: 'Default Layout', rows: 10, cols: 10 }, { transaction: t });
        }
        receivingSlot = await WarehouseSlot.create({
          layout_id: layout.id,
          name: 'RECEIVING',
          x: -1, y: -1,
          zone: 'RECEIVING',
          capacity: 0 // Unlimited
        }, { transaction: t });
      }

      for (const detail of stockIn.items) {
        const product = await Item.findByPk(detail.item_id, { lock: true, transaction: t });
        const stockBefore = parseFloat(product.current_stock);
        const qty = parseFloat(detail.quantity);
        const stockAfter = stockBefore + qty;

        await product.update({ current_stock: stockAfter }, { transaction: t });
        await detail.update({ stock_before: stockBefore, stock_after: stockAfter }, { transaction: t });

        // Update StockPosition (Add to Receiving)
        let pos = await StockPosition.findOne({ where: { item_id: product.id, slot_id: receivingSlot.id }, transaction: t, lock: true });
        if (pos) {
          await pos.update({ quantity: parseFloat(pos.quantity) + qty }, { transaction: t });
        } else {
          await StockPosition.create({ item_id: product.id, slot_id: receivingSlot.id, quantity: qty }, { transaction: t });
        }

        await StockRepository.createMutation({
          item_id: product.id,
          type: 'in',
          quantity: qty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: 'stock_in',
          reference_id: stockIn.id,
          created_by: userId,
        }, t);
      }

      await stockIn.update({
        status: 'confirmed',
        confirmed_at: new Date(),
        confirmed_by: userId,
      }, { transaction: t });

      await t.commit();
      return stockIn;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ─── STOCK OUT ──────────────────────────────────────
  async getStockOutList(query) {
    const { page = 1, search, status } = query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: stockOuts } = await StockRepository.findAndCountStockOut({
      search, status, limit, offset
    });

    return {
      stockOuts,
      count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }

  async getStockOutCreateData() {
    const refNo = await ReferenceGenerator.stockOut();
    const customers = await require('../models').Customer.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    const today = new Date().toISOString().split('T')[0];
    return { refNo, customers, today };
  }

  async createStockOutDraft(data, userId) {
    const t = await sequelize.transaction();
    try {
      const { reference_no, customer_id, issued_at, notes, items } = data;

      const stockOut = await StockRepository.createStockOut({
        reference_no, customer_id, issued_at,
        notes: notes || null,
        issued_by: userId,
        status: 'draft',
      }, t);

      const itemList = this._parseItems(items);
      for (const it of itemList) {
        if (!it.item_id || !it.quantity) continue;
        const product = await Item.findByPk(it.item_id, { transaction: t });
        if (!product) continue;

        const qty = parseFloat(it.quantity);
        const stockBefore = parseFloat(product.current_stock);

        await StockRepository.createStockOutItem({
          stock_out_id: stockOut.id,
          item_id: it.item_id,
          quantity: qty,
          stock_before: stockBefore,
          stock_after: stockBefore - qty,
        }, t);
      }

      await t.commit();
      return stockOut;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async confirmStockOut(id, userId) {
    const t = await sequelize.transaction();
    try {
      const { StockPosition } = require('../models');
      const stockOut = await StockRepository.findStockOutById(id, true);
      if (!stockOut) throw new Error('Transaksi tidak ditemukan.');
      if (stockOut.status === 'confirmed') throw new Error('Transaksi sudah dikonfirmasi.');

      // Validation pass
      const productCache = {};
      for (const detail of stockOut.items) {
        const product = await Item.findByPk(detail.item_id, { lock: true, transaction: t });
        if (!product) throw new Error(`Barang ID ${detail.item_id} tidak ditemukan.`);
        
        if (parseFloat(product.current_stock) < parseFloat(detail.quantity)) {
          throw new Error(`Stok ${product.name} tidak mencukupi. Tersedia: ${parseFloat(product.current_stock).toLocaleString('id-ID')}`);
        }
        productCache[detail.item_id] = product;
      }

      // Update pass
      for (const detail of stockOut.items) {
        const product = productCache[detail.item_id];
        const stockBefore = parseFloat(product.current_stock);
        const qty = parseFloat(detail.quantity);
        const stockAfter = stockBefore - qty;

        await product.update({ current_stock: stockAfter }, { transaction: t });
        await detail.update({ stock_before: stockBefore, stock_after: stockAfter }, { transaction: t });

        // Update StockPosition (Deduct from available slots - FIFO logic)
        let remainingToDeduct = qty;
        const positions = await StockPosition.findAll({
          where: { item_id: product.id, quantity: { [require('sequelize').Op.gt]: 0 } },
          order: [['updated_at', 'ASC']], // FIFO-ish based on update time
          transaction: t,
          lock: true
        });

        for (const pos of positions) {
          if (remainingToDeduct <= 0) break;
          const posQty = parseFloat(pos.quantity);
          if (posQty <= remainingToDeduct) {
            remainingToDeduct -= posQty;
            await pos.destroy({ transaction: t });
          } else {
            await pos.update({ quantity: posQty - remainingToDeduct }, { transaction: t });
            remainingToDeduct = 0;
          }
        }

        // If after checking all slots we still have remainingToDeduct, it means the item was not fully positioned
        // We allow this but logically it should not happen if consistency is maintained.
        // For robustness, we don't throw here but in a strict system we might.

        await StockRepository.createMutation({
          item_id: product.id,
          type: 'out',
          quantity: qty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: 'stock_out',
          reference_id: stockOut.id,
          created_by: userId,
        }, t);
      }

      await stockOut.update({
        status: 'confirmed',
        confirmed_at: new Date(),
        confirmed_by: userId,
      }, { transaction: t });

      await t.commit();
      return stockOut;
    } catch (err) {
      console.error('DATABASE ERROR IN StockService confirmStockOut:', err);
      await t.rollback();
      throw err;
    }
  }
}

module.exports = new StockService();
