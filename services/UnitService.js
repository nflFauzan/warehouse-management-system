const UnitRepository = require('../repositories/UnitRepository');

class UnitService {
  async getAllUnits() {
    return await UnitRepository.findAll();
  }

  async getUnitById(id) {
    return await UnitRepository.findById(id);
  }

  async createUnit(data) {
    return await UnitRepository.create(data);
  }

  async updateUnit(id, data) {
    return await UnitRepository.update(id, data);
  }

  async deleteUnit(id) {
    return await UnitRepository.delete(id);
  }
}

module.exports = new UnitService();
