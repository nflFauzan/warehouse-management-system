const router = require('express').Router();
const { isAuthenticated, checkRole } = require('../middleware/auth');
const { Item, Category, Unit, StockMutation, StockIn, StockOut } = require('../models');
const { Op, literal } = require('sequelize');

router.get('/stok', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const dateFrom = req.query.date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const dateTo = req.query.date_to || new Date().toISOString().split('T')[0];
    const { category_id } = req.query;

    const where = { is_active: true };
    if (category_id) where.category_id = category_id;

    const allItems = await Item.findAll({ where, include: ['category', 'unit'], order: [['name', 'ASC']] });

    const items = await Promise.all(allItems.map(async (item) => {
      const totalIn = (await StockMutation.sum('quantity', {
        where: {
          item_id: item.id, type: 'in',
          created_at: { [Op.between]: [new Date(dateFrom), new Date(dateTo + 'T23:59:59')] },
        },
      })) || 0;

      const totalOut = (await StockMutation.sum('quantity', {
        where: {
          item_id: item.id, type: 'out',
          created_at: { [Op.between]: [new Date(dateFrom), new Date(dateTo + 'T23:59:59')] },
        },
      })) || 0;

      const stokAwal = Math.max(0, parseFloat(item.current_stock) - totalIn + totalOut);

      return {
        item, stok_awal: stokAwal,
        total_in: totalIn, total_out: totalOut,
        stok_akhir: parseFloat(item.current_stock),
      };
    }));

    const summary = {
      total_in: items.reduce((s, i) => s + i.total_in, 0),
      total_out: items.reduce((s, i) => s + i.total_out, 0),
      net: items.reduce((s, i) => s + i.total_in - i.total_out, 0),
    };

    const categories = await Category.findAll({ order: [['name', 'ASC']] });

    res.render('laporan/stock', {
      title: 'Laporan Stok — TAKKA STEEL',
      items, summary, categories, dateFrom, dateTo,
      category_id: category_id || '',
      currentPath: '/laporan/stok',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat laporan stok.');
    res.redirect('/');
  }
});

router.get('/masuk', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const dateFrom = req.query.date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const dateTo = req.query.date_to || new Date().toISOString().split('T')[0];

    const stockIns = await StockIn.findAll({
      where: {
        status: 'confirmed',
        received_at: { [Op.between]: [dateFrom, dateTo] },
      },
      include: [
        { model: require('../models').Supplier, as: 'supplier' },
        { model: require('../models').User, as: 'receivedBy' },
        { model: require('../models').StockInItem, as: 'items', include: [{ model: Item, as: 'item', include: ['unit'] }] },
      ],
      order: [['received_at', 'DESC']],
    });

    res.render('laporan/stockIn', {
      title: 'Laporan Barang Masuk — TAKKA STEEL',
      stockIns, dateFrom, dateTo,
      currentPath: '/laporan/masuk',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat laporan barang masuk.');
    res.redirect('/');
  }
});

router.get('/keluar', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const dateFrom = req.query.date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const dateTo = req.query.date_to || new Date().toISOString().split('T')[0];

    const stockOuts = await StockOut.findAll({
      where: {
        status: 'confirmed',
        issued_at: { [Op.between]: [dateFrom, dateTo] },
      },
      include: [
        { model: require('../models').Customer, as: 'customer' },
        { model: require('../models').User, as: 'issuedBy' },
        { model: require('../models').StockOutItem, as: 'items', include: [{ model: Item, as: 'item', include: ['unit'] }] },
      ],
      order: [['issued_at', 'DESC']],
    });

    res.render('laporan/stockOut', {
      title: 'Laporan Barang Keluar — TAKKA STEEL',
      stockOuts, dateFrom, dateTo,
      currentPath: '/laporan/keluar',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat laporan barang keluar.');
    res.redirect('/');
  }
});

module.exports = router;
