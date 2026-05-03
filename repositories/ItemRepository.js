const { Item, Category, Unit, sequelize } = require('../models');
const { Op } = require('sequelize');

class ItemRepository {
  async findAndCountAll(options = {}) {
    const { search, category_id, status, limit, offset } = options;
    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    if (category_id) where.category_id = category_id;

    let extraWhere = null;
    if (status === 'critical') {
      extraWhere = sequelize.literal('current_stock <= minimum_stock AND minimum_stock > 0');
    } else if (status === 'safe') {
      extraWhere = sequelize.literal('(current_stock > minimum_stock OR minimum_stock = 0)');
    }

    const finalWhere = extraWhere ? { ...where, [Op.and]: extraWhere } : where;

    return await Item.findAndCountAll({
      where: finalWhere,
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' },
      ],
      order: [['name', 'ASC']],
      limit,
      offset
    });
  }

  async findById(id) {
    return await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' },
      ]
    });
  }

  async create(data) {
    return await Item.create(data);
  }

  async update(id, data) {
    const item = await Item.findByPk(id);
    if (!item) return null;
    return await item.update(data);
  }

  async softDelete(id) {
    const item = await Item.findByPk(id);
    if (!item) return null;
    return await item.update({ is_active: false });
  }
}

module.exports = new ItemRepository();
