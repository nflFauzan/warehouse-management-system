const { Customer } = require('../models');
const { Op } = require('sequelize');

class CustomerRepository {
  async findAndCountAll(options = {}) {
    const { search, limit, offset } = options;
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return await Customer.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset
    });
  }

  async findById(id) {
    return await Customer.findByPk(id);
  }

  async create(data) {
    return await Customer.create(data);
  }

  async update(id, data) {
    const customer = await this.findById(id);
    if (!customer) return null;
    return await customer.update(data);
  }

  async softDelete(id) {
    const customer = await this.findById(id);
    if (!customer) return null;
    return await customer.update({ is_active: false });
  }
}

module.exports = new CustomerRepository();
