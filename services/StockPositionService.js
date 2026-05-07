const { Item, Category, sequelize } = require('../models');
const { Op } = require('sequelize');
const ItemRepository = require('../repositories/ItemRepository');

class StockPositionService {
  async getStockPosition(query) {
    const { search, category_id, status, page = 1 } = query;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Use ItemRepository for the filtered items list
    // Wait, ItemRepository uses 'unit' and 'category' aliases which matches what we need
    const { count, rows: items } = await ItemRepository.findAndCountAll({
      search, category_id, status, limit, offset, includePositions: true
    });

    const categories = await Category.findAll({ order: [['name', 'ASC']] });

    // Calculate summary statistics (Global, unaffected by current pagination/filters)
    const totalItems = await Item.count({ where: { is_active: true } });

    const emptyItemsCount = await Item.count({
      where: {
        is_active: true,
        current_stock: { [Op.lte]: 0 }
      }
    });

    const criticalItemsCount = await Item.count({
      where: {
        is_active: true,
        [Op.and]: [
          sequelize.literal('current_stock <= minimum_stock'),
          sequelize.literal('current_stock > 0'),
          sequelize.literal('minimum_stock > 0')
        ]
      }
    });

    return {
      items,
      categories,
      count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      summary: {
        totalItems,
        criticalItemsCount,
        emptyItemsCount
      }
    };
  }
}

module.exports = new StockPositionService();
