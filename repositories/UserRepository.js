const { User } = require('../models');

class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  async findById(id) {
    return await User.findByPk(id);
  }

  async findAll() {
    return await User.findAll({ order: [['name', 'ASC']] });
  }

  async create(data) {
    return await User.create(data);
  }

  async update(id, data) {
    const user = await this.findById(id);
    if (!user) return null;
    return await user.update(data);
  }
}

module.exports = new UserRepository();
