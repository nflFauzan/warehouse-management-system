const { Unit } = require('../models');

class UnitRepository {
  async findAll(options = {}) {
    return await Unit.findAll({
      order: [['name', 'ASC']],
      ...options
    });
  }

  async findById(id) {
    return await Unit.findByPk(id);
  }

  async create(data) {
    return await Unit.create(data);
  }

  async update(id, data) {
    const unit = await this.findById(id);
    if (!unit) return null;
    return await unit.update(data);
  }

  async delete(id) {
    return await Unit.destroy({ where: { id } });
  }
}

module.exports = new UnitRepository();
