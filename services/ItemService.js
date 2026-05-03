const ItemRepository = require('../repositories/ItemRepository');
const CategoryService = require('./CategoryService');
const UnitService = require('./UnitService');

class ItemService {
  async getItems(query) {
    const { search, category_id, status, page = 1 } = query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: items } = await ItemRepository.findAndCountAll({
      search,
      category_id,
      status,
      limit,
      offset
    });

    const categories = await CategoryService.getAllCategories();

    return {
      items,
      categories,
      count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }

  async getItemById(id) {
    return await ItemRepository.findById(id);
  }

  async getFormData() {
    const categories = await CategoryService.getAllCategories();
    const units = await UnitService.getAllUnits();
    return { categories, units };
  }

  async createItem(data) {
    const processedData = {
      ...data,
      current_stock: parseFloat(data.current_stock) || 0,
      minimum_stock: parseFloat(data.minimum_stock) || 0,
    };
    return await ItemRepository.create(processedData);
  }

  async updateItem(id, data) {
    const processedData = {
      ...data,
      minimum_stock: parseFloat(data.minimum_stock) || 0,
    };
    return await ItemRepository.update(id, processedData);
  }

  async deleteItem(id) {
    return await ItemRepository.softDelete(id);
  }
}

module.exports = new ItemService();
