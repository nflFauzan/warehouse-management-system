const router = require('express').Router();
const { isAuthenticated } = require('../middleware/auth');
const { Item, Category, Unit, StockMutation, User } = require('../models');
const { Op, literal } = require('sequelize');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, category_id, status, page = 1 } = req.query;
    const limit = 25;
    const offset = (page - 1) * limit;
    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
      ];
    }
    if (category_id) where.category_id = category_id;

    let extraWhere = null;
    if (status === 'critical') {
      extraWhere = literal('current_stock <= minimum_stock AND minimum_stock > 0 AND current_stock > 0');
    } else if (status === 'safe') {
      extraWhere = literal('(current_stock > minimum_stock OR minimum_stock = 0)');
    } else if (status === 'empty') {
      extraWhere = literal('current_stock <= 0');
    }

    const { count, rows: items } = await Item.findAndCountAll({
      where: extraWhere ? { ...where, [Op.and]: extraWhere } : where,
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' },
      ],
      order: [
        [literal('CASE WHEN current_stock <= minimum_stock AND minimum_stock > 0 THEN 0 ELSE 1 END'), 'ASC'],
        ['name', 'ASC'],
      ],
      limit, offset,
    });

    const summary = {
      total: await Item.count({ where: { is_active: true } }),
      safe: await Item.count({ where: { is_active: true, [Op.and]: literal('(current_stock > minimum_stock OR minimum_stock = 0)') } }),
      critical: await Item.count({ where: { is_active: true, [Op.and]: literal('current_stock <= minimum_stock AND minimum_stock > 0 AND current_stock > 0') } }),
      empty: await Item.count({ where: { is_active: true, [Op.and]: literal('current_stock <= 0') } }),
    };

    const categories = await Category.findAll({ order: [['name', 'ASC']] });

    res.render('stock/index', {
      title: 'Posisi Stok — TAKKA STEEL',
      items, summary, categories, count,
      currentPage: parseInt(page), totalPages: Math.ceil(count / limit),
      search: search || '', category_id: category_id || '', status: status || '',
      currentPath: '/stock',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat data stok.');
    res.redirect('/');
  }
});

router.get('/:id/history', isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, { include: ['category', 'unit'] });
    if (!item) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });

    const { page = 1 } = req.query;
    const limit = 30;
    const offset = (page - 1) * limit;

    const { count, rows: mutations } = await StockMutation.findAndCountAll({
      where: { item_id: item.id },
      include: [{ model: User, as: 'createdBy', attributes: ['name'] }],
      order: [['created_at', 'DESC']],
      limit, offset,
    });

    res.render('stock/history', {
      title: `Riwayat ${item.name} — TAKKA STEEL`,
      item, mutations, count,
      currentPage: parseInt(page), totalPages: Math.ceil(count / limit),
      currentPath: '/stock',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat riwayat stok.');
    res.redirect('/stock');
  }
});

module.exports = router;
