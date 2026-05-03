const { Supplier } = require('../models');
const { Op } = require('sequelize');

class SupplierRepository {
  async findAndCountAll(options = {}) {
    const { search, limit, offset } = options;
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return await Supplier.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset
    });
  }

  async findById(id) {
    return await Supplier.findByPk(id);
  }

  async create(data) {
    return await Supplier.create(data);
  }

  async update(id, data) {
    const supplier = await this.findById(id);
    if (!supplier) return null;
    return await supplier.update(data);
  }

  async softDelete(id) {
    const supplier = await this.findById(id);
    if (!supplier) return null;
    return await supplier.update({ is_active: false });
  }
}

module.exports = new SupplierRepository();
