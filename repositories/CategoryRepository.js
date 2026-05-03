const { Category } = require('../models');

class CategoryRepository {
  async findAll(options = {}) {
    return await Category.findAll({
      order: [['name', 'ASC']],
      ...options
    });
  }

  async findById(id) {
    return await Category.findByPk(id);
  }

  async create(data) {
    return await Category.create(data);
  }

  async update(id, data) {
    const category = await this.findById(id);
    if (!category) return null;
    return await category.update(data);
  }

  async delete(id) {
    return await Category.destroy({ where: { id } });
  }
}

module.exports = new CategoryRepository();
