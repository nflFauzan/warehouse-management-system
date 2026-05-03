const SupplierRepository = require('../repositories/SupplierRepository');

class SupplierService {
  async getSuppliers(query) {
    const { search, page = 1 } = query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: suppliers } = await SupplierRepository.findAndCountAll({
      search,
      limit,
      offset
    });

    return {
      suppliers,
      count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }

  async getSupplierById(id) {
    return await SupplierRepository.findById(id);
  }

  async createSupplier(data) {
    return await SupplierRepository.create(data);
  }

  async updateSupplier(id, data) {
    return await SupplierRepository.update(id, data);
  }

  async deleteSupplier(id) {
    return await SupplierRepository.softDelete(id);
  }
}

module.exports = new SupplierService();
