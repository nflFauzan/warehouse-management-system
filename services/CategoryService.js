const CategoryRepository = require('../repositories/CategoryRepository');

class CategoryService {
  async getAllCategories() {
    return await CategoryRepository.findAll();
  }

  async getCategoryById(id) {
    return await CategoryRepository.findById(id);
  }

  async createCategory(data) {
    const { name } = data;
    const slug = this._generateSlug(name);
    return await CategoryRepository.create({ name, slug });
  }

  async updateCategory(id, data) {
    const { name } = data;
    const updateData = { name };
    if (name) {
      updateData.slug = this._generateSlug(name);
    }
    return await CategoryRepository.update(id, updateData);
  }

  async deleteCategory(id) {
    return await CategoryRepository.delete(id);
  }

  _generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }
}

module.exports = new CategoryService();
