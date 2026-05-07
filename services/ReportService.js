const { Item, Category, StockMutation, StockIn, StockOut, StockInItem, StockOutItem, Supplier, Customer, User } = require('../models');
const { Op } = require('sequelize');

class ReportService {
  // Laporan Stok Periodik
  async getStockReport(query) {
    const dateFrom = query.date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const dateTo = query.date_to || new Date().toISOString().split('T')[0];
    const { category_id } = query;

    const where = { is_active: true };
    if (category_id) where.category_id = category_id;

    const allItems = await Item.findAll({ where, include: ['category', 'unit'], order: [['name', 'ASC']] });

    const items = await Promise.all(allItems.map(async (item) => {
      const totalIn = (await StockMutation.sum('quantity', {
        where: {
          item_id: item.id, type: 'in',
          created_at: { [Op.between]: [new Date(dateFrom), new Date(dateTo + 'T23:59:59')] },
        },
      })) || 0;

      const totalOut = (await StockMutation.sum('quantity', {
        where: {
          item_id: item.id, type: 'out',
          created_at: { [Op.between]: [new Date(dateFrom), new Date(dateTo + 'T23:59:59')] },
        },
      })) || 0;

      const stokAwal = Math.max(0, parseFloat(item.current_stock) - totalIn + totalOut);

      return {
        item, stok_awal: stokAwal,
        total_in: totalIn, total_out: totalOut,
        stok_akhir: parseFloat(item.current_stock),
      };
    }));

    const summary = {
      total_in: items.reduce((s, i) => s + i.total_in, 0),
      total_out: items.reduce((s, i) => s + i.total_out, 0),
      net: items.reduce((s, i) => s + i.total_in - i.total_out, 0),
    };

    const categories = await Category.findAll({ order: [['name', 'ASC']] });

    return { items, summary, categories, dateFrom, dateTo };
  }

  // Laporan Barang Masuk
  async getStockInReport(query) {
    const dateFrom = query.date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const dateTo = query.date_to || new Date().toISOString().split('T')[0];

    const stockIns = await StockIn.findAll({
      where: {
        status: 'confirmed',
        received_at: { [Op.between]: [dateFrom, dateTo] },
      },
      include: [
        { model: Supplier, as: 'supplier' },
        { model: User, as: 'receivedBy' },
        { model: StockInItem, as: 'items', include: [{ model: Item, as: 'item', include: ['unit'] }] },
      ],
      order: [['received_at', 'DESC']],
    });

    return { stockIns, dateFrom, dateTo };
  }

  // Laporan Barang Keluar
  async getStockOutReport(query) {
    const dateFrom = query.date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const dateTo = query.date_to || new Date().toISOString().split('T')[0];

    const stockOuts = await StockOut.findAll({
      where: {
        status: 'confirmed',
        issued_at: { [Op.between]: [dateFrom, dateTo] },
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'issuedBy' },
        { model: StockOutItem, as: 'items', include: [{ model: Item, as: 'item', include: ['unit'] }] },
      ],
      order: [['issued_at', 'DESC']],
    });

    return { stockOuts, dateFrom, dateTo };
  }
}

module.exports = new ReportService();
