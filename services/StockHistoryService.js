const { StockMutation, StockIn, StockOut, User, Item, Unit } = require('../models');

class StockHistoryService {
  async getHistory(itemId, query) {
    const { page = 1 } = query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const item = await Item.findByPk(itemId, { include: ['unit', 'category'] });
    if (!item) throw new Error('Barang tidak ditemukan');

    const { count, rows: mutations } = await StockMutation.findAndCountAll({
      where: { item_id: itemId },
      include: [
        { model: User, as: 'createdBy', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Extract reference IDs to batch fetch reference numbers
    const stockInIds = mutations.filter(m => m.reference_type === 'stock_in').map(m => m.reference_id);
    const stockOutIds = mutations.filter(m => m.reference_type === 'stock_out').map(m => m.reference_id);

    const stockIns = stockInIds.length > 0 ? await StockIn.findAll({ where: { id: stockInIds }, attributes: ['id', 'reference_no'] }) : [];
    const stockOuts = stockOutIds.length > 0 ? await StockOut.findAll({ where: { id: stockOutIds }, attributes: ['id', 'reference_no'] }) : [];

    const stockInMap = stockIns.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.reference_no }), {});
    const stockOutMap = stockOuts.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.reference_no }), {});

    const history = mutations.map(m => {
      const data = m.toJSON();
      data.reference_no = data.reference_type === 'stock_in' 
        ? (stockInMap[data.reference_id] || `ID: ${data.reference_id}`)
        : (stockOutMap[data.reference_id] || `ID: ${data.reference_id}`);
      return data;
    });

    return {
      item,
      history,
      count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = new StockHistoryService();
