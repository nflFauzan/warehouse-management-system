const { Item, StockIn, StockOut, StockMutation, User } = require('../models');
const { Op, literal } = require('sequelize');

class DashboardService {
  async getDashboardData() {
    const today = new Date().toISOString().split('T')[0];

    // Stats cards
    const stats = {
      total_sku: await Item.count({ where: { is_active: true } }),
      in_today: await StockIn.count({ where: { received_at: today, status: 'confirmed' } }),
      out_today: await StockOut.count({ where: { issued_at: today, status: 'confirmed' } }),
      critical_items: await Item.count({
        where: {
          is_active: true,
          minimum_stock: { [Op.gt]: 0 },
          [Op.and]: literal('current_stock <= minimum_stock'),
        },
      }),
    };

    // Recent transactions (last 8 mutations)
    const recent_transactions = await StockMutation.findAll({
      include: [
        { model: Item, as: 'item', attributes: ['code', 'name'] },
        { model: User, as: 'createdBy', attributes: ['name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 8,
    });

    // Critical items (top 5)
    const critical_items = await Item.findAll({
      where: {
        is_active: true,
        minimum_stock: { [Op.gt]: 0 },
        [Op.and]: literal('current_stock <= minimum_stock'),
      },
      include: ['category', 'unit'],
      order: [['current_stock', 'ASC']],
      limit: 5,
    });

    // Chart data: 7 days
    const chart_data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      chart_data.push({
        date: dateStr,
        label: dayNames[d.getDay()],
        in: await StockIn.count({ where: { received_at: dateStr, status: 'confirmed' } }),
        out: await StockOut.count({ where: { issued_at: dateStr, status: 'confirmed' } }),
      });
    }

    return { stats, recent_transactions, critical_items, chart_data };
  }
}

module.exports = new DashboardService();
