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
      const result = await WarehouseService.moveStock(req.body, req.session.userId || 1); // Fallback to 1 for testing
      res.json(result);
    } catch (err) {
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
}

module.exports = new WarehouseController();
