const WarehouseService = require('../services/WarehouseService');

class WarehouseController {
  async getLayout(req, res) {
    try {
      const layout = await WarehouseService.getActiveLayout();
      res.json(layout);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async saveLayout(req, res) {
    try {
      const layout = await WarehouseService.saveLayout(req.body);
      res.json(layout);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async moveStock(req, res) {
    try {
      const { item_id, from_slot_id, to_slot_id, quantity } = req.body;
      const userId = req.session.user?.id || 1;
      const result = await WarehouseService.moveStock({ 
        item_id: parseInt(item_id), 
        from_slot_id: from_slot_id || null, 
        to_slot_id, 
        quantity: parseFloat(quantity),
        notes: req.body.notes 
      }, userId);
      res.json(result);
    } catch (err) {
      console.error('ERROR IN moveStock:', err);
      res.status(400).json({ message: err.message });
    }
  }

  async getSlots(req, res) {
    try {
      const slots = await WarehouseService.getLayoutSlots();
      res.json(slots);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getHistory(req, res) {
    try {
      res.json(await WarehouseService.getSlotHistory(req.params.id));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new WarehouseController();
