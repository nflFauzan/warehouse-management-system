const { StockIn, StockInItem, StockOut, StockOutItem, StockMutation, Supplier, Customer, User, Item, Unit } = require('../models');
const { Op } = require('sequelize');

class StockRepository {
  // ─── STOCK IN ───────────────────────────────────────
  async findAndCountStockIn(options = {}) {
    const { search, status, limit, offset } = options;
    const where = {};
    if (search) where.reference_no = { [Op.iLike]: `%${search}%` };
    if (status) where.status = status;

    return await StockIn.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['name'] },
        { model: User, as: 'receivedBy', attributes: ['name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
  }

  async findStockInById(id, includeItems = false) {
    const include = [
      { model: Supplier, as: 'supplier' },
      { model: User, as: 'receivedBy' },
      { model: User, as: 'confirmedBy' },
    ];
    if (includeItems) {
      include.push({
        model: StockInItem,
        as: 'items',
        include: [{ model: Item, as: 'item', include: ['unit'] }]
      });
    }
    return await StockIn.findByPk(id, { include });
  }

  async createStockIn(data, transaction) {
    return await StockIn.create(data, { transaction });
  }

  async createStockInItem(data, transaction) {
    return await StockInItem.create(data, { transaction });
  }

  // ─── STOCK OUT ──────────────────────────────────────
  async findAndCountStockOut(options = {}) {
    const { search, status, limit, offset } = options;
    const where = {};
    if (search) where.reference_no = { [Op.iLike]: `%${search}%` };
    if (status) where.status = status;

    return await StockOut.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['name'] },
        { model: User, as: 'issuedBy', attributes: ['name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
  }

  async findStockOutById(id, includeItems = false) {
    const include = [
      { model: Customer, as: 'customer' },
      { model: User, as: 'issuedBy' },
      { model: User, as: 'confirmedBy' },
    ];
    if (includeItems) {
      include.push({
        model: StockOutItem,
        as: 'items',
        include: [{ model: Item, as: 'item', include: ['unit'] }]
      });
    }
    return await StockOut.findByPk(id, { include });
  }

  async createStockOut(data, transaction) {
    return await StockOut.create(data, { transaction });
  }

  async createStockOutItem(data, transaction) {
    return await StockOutItem.create(data, { transaction });
  }

  // ─── MUTATION ───────────────────────────────────────
  async createMutation(data, transaction) {
    return await StockMutation.create(data, { transaction });
  }
}

module.exports = new StockRepository();
