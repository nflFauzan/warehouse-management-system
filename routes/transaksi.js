const router = require('express').Router();
const { isAuthenticated, checkRole } = require('../middleware/auth');
const { sequelize, Item, Supplier, Customer, StockIn, StockInItem, StockOut, StockOutItem, StockMutation } = require('../models');
const ReferenceGenerator = require('../helpers/ReferenceGenerator');

/**
 * express.urlencoded({ extended: true }) parses items[0][item_id] as
 * an object { '0': { item_id, quantity }, '1': {...} } NOT a real array.
 * This helper normalises both formats into a plain array.
 */
function parseItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  // object keyed by numeric strings
  return Object.keys(raw)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(k => raw[k]);
}

// ═══════════════════════════════════════════════════
// STOCK IN — BARANG MASUK
// ═══════════════════════════════════════════════════
router.get('/masuk', isAuthenticated, async (req, res) => {
  const { page = 1, search, status } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { Op } = require('sequelize');
  const where = {};
  if (search) where.reference_no = { [Op.like]: `%${search}%` };
  if (status) where.status = status;

  const { count, rows: stockIns } = await StockIn.findAndCountAll({
    where,
    include: [
      { model: Supplier, as: 'supplier', attributes: ['name'] },
      { model: require('../models').User, as: 'receivedBy', attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
    limit, offset,
  });

  res.render('transaksi/masuk/index', {
    title: 'Barang Masuk — TAKKA STEEL',
    stockIns, count,
    currentPage: parseInt(page), totalPages: Math.ceil(count / limit),
    search: search || '', status: status || '',
    currentPath: '/transaksi/masuk',
  });
});

router.get('/masuk/create', isAuthenticated, async (req, res) => {
  const refNo = await ReferenceGenerator.stockIn();
  const suppliers = await Supplier.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
  const today = new Date().toISOString().split('T')[0];
  res.render('transaksi/masuk/form', {
    title: 'Tambah Barang Masuk — TAKKA STEEL',
    stockIn: null, refNo, suppliers, today,
    currentPath: '/transaksi/masuk',
  });
});

router.post('/masuk', isAuthenticated, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { reference_no, supplier_id, received_at, supplier_ref, notes, items, action } = req.body;

    const stockIn = await StockIn.create({
      reference_no, supplier_id, received_at,
      supplier_ref: supplier_ref || null,
      notes: notes || null,
      received_by: req.session.user.id,
      status: 'draft',
    }, { transaction: t });

    const itemList = parseItems(items);
    for (const it of itemList) {
      if (!it.item_id || !it.quantity) continue;
      const product = await Item.findByPk(it.item_id, { transaction: t });
      if (!product) continue;
      const qty = parseFloat(it.quantity);
      const stockBefore = parseFloat(product.current_stock);
      await StockInItem.create({
        stock_in_id: stockIn.id,
        item_id: it.item_id,
        quantity: qty,
        stock_before: stockBefore,
        stock_after: stockBefore + qty,
      }, { transaction: t });
    }

    await t.commit();

    if (action === 'confirm' && ['admin', 'owner'].includes(req.session.user.role)) {
      return res.redirect(`/transaksi/masuk/${stockIn.id}/confirm-action`);
    }

    req.flash('success', 'Draft barang masuk berhasil disimpan.');
    res.redirect(`/transaksi/masuk/${stockIn.id}`);
  } catch (err) {
    await t.rollback();
    console.error(err);
    req.flash('error', err.message || 'Gagal menyimpan transaksi.');
    res.redirect('/transaksi/masuk/create');
  }
});

router.get('/masuk/:id', isAuthenticated, async (req, res) => {
  const stockIn = await StockIn.findByPk(req.params.id, {
    include: [
      { model: Supplier, as: 'supplier' },
      { model: require('../models').User, as: 'receivedBy' },
      { model: require('../models').User, as: 'confirmedBy' },
      { model: StockInItem, as: 'items', include: [{ model: Item, as: 'item', include: ['unit'] }] },
    ],
  });
  if (!stockIn) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });

  res.render('transaksi/masuk/show', {
    title: `${stockIn.reference_no} — TAKKA STEEL`,
    stockIn,
    currentPath: '/transaksi/masuk',
  });
});

router.get('/masuk/:id/confirm-action', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const stockIn = await StockIn.findByPk(req.params.id, {
      include: [{ model: StockInItem, as: 'items' }],
      transaction: t,
    });

    if (!stockIn) { await t.rollback(); return res.status(404).render('errors/404', { title: '404', currentPath: req.path }); }
    if (stockIn.status === 'confirmed') {
      await t.rollback();
      req.flash('error', 'Transaksi sudah dikonfirmasi.');
      return res.redirect(`/transaksi/masuk/${stockIn.id}`);
    }

    for (const detail of stockIn.items) {
      const product = await Item.findByPk(detail.item_id, { lock: true, transaction: t });
      const stockBefore = parseFloat(product.current_stock);
      const stockAfter = stockBefore + parseFloat(detail.quantity);

      await product.update({ current_stock: stockAfter }, { transaction: t });
      await detail.update({ stock_before: stockBefore, stock_after: stockAfter }, { transaction: t });

      await StockMutation.create({
        item_id: product.id,
        type: 'in',
        quantity: parseFloat(detail.quantity),
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type: 'stock_in',
        reference_id: stockIn.id,
        created_by: req.session.user.id,
      }, { transaction: t });
    }

    await stockIn.update({
      status: 'confirmed',
      confirmed_at: new Date(),
      confirmed_by: req.session.user.id,
    }, { transaction: t });

    await t.commit();
    req.flash('success', 'Transaksi berhasil dikonfirmasi. Stok telah diperbarui.');
    res.redirect(`/transaksi/masuk/${stockIn.id}`);
  } catch (err) {
    await t.rollback();
    console.error(err);
    req.flash('error', err.message || 'Gagal mengkonfirmasi transaksi.');
    res.redirect(`/transaksi/masuk/${req.params.id}`);
  }
});

// ═══════════════════════════════════════════════════
// STOCK OUT — BARANG KELUAR
// ═══════════════════════════════════════════════════
router.get('/keluar', isAuthenticated, async (req, res) => {
  const { page = 1, search, status } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { Op } = require('sequelize');
  const where = {};
  if (search) where.reference_no = { [Op.like]: `%${search}%` };
  if (status) where.status = status;

  const { count, rows: stockOuts } = await StockOut.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['name'] },
      { model: require('../models').User, as: 'issuedBy', attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
    limit, offset,
  });

  res.render('transaksi/keluar/index', {
    title: 'Barang Keluar — TAKKA STEEL',
    stockOuts, count,
    currentPage: parseInt(page), totalPages: Math.ceil(count / limit),
    search: search || '', status: status || '',
    currentPath: '/transaksi/keluar',
  });
});

router.get('/keluar/create', isAuthenticated, async (req, res) => {
  const refNo = await ReferenceGenerator.stockOut();
  const customers = await Customer.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
  const today = new Date().toISOString().split('T')[0];
  res.render('transaksi/keluar/form', {
    title: 'Tambah Barang Keluar — TAKKA STEEL',
    stockOut: null, refNo, customers, today,
    currentPath: '/transaksi/keluar',
  });
});

router.post('/keluar', isAuthenticated, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { reference_no, customer_id, issued_at, notes, items, action } = req.body;

    const stockOut = await StockOut.create({
      reference_no, customer_id, issued_at,
      notes: notes || null,
      issued_by: req.session.user.id,
      status: 'draft',
    }, { transaction: t });

    const itemList = parseItems(items);
    for (const it of itemList) {
      if (!it.item_id || !it.quantity) continue;
      const product = await Item.findByPk(it.item_id, { transaction: t });
      if (!product) continue;
      const qty = parseFloat(it.quantity);
      const stockBefore = parseFloat(product.current_stock);
      await StockOutItem.create({
        stock_out_id: stockOut.id,
        item_id: it.item_id,
        quantity: qty,
        stock_before: stockBefore,
        stock_after: stockBefore - qty,
      }, { transaction: t });
    }

    await t.commit();

    if (action === 'confirm' && ['admin', 'owner'].includes(req.session.user.role)) {
      return res.redirect(`/transaksi/keluar/${stockOut.id}/confirm-action`);
    }

    req.flash('success', 'Draft barang keluar berhasil disimpan.');
    res.redirect(`/transaksi/keluar/${stockOut.id}`);
  } catch (err) {
    await t.rollback();
    console.error(err);
    req.flash('error', err.message || 'Gagal menyimpan transaksi.');
    res.redirect('/transaksi/keluar/create');
  }
});

router.get('/keluar/:id', isAuthenticated, async (req, res) => {
  const stockOut = await StockOut.findByPk(req.params.id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: require('../models').User, as: 'issuedBy' },
      { model: require('../models').User, as: 'confirmedBy' },
      { model: StockOutItem, as: 'items', include: [{ model: Item, as: 'item', include: ['unit'] }] },
    ],
  });
  if (!stockOut) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });

  res.render('transaksi/keluar/show', {
    title: `${stockOut.reference_no} — TAKKA STEEL`,
    stockOut,
    currentPath: '/transaksi/keluar',
  });
});

router.get('/keluar/:id/confirm-action', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const stockOut = await StockOut.findByPk(req.params.id, {
      include: [{ model: StockOutItem, as: 'items' }],
      transaction: t,
    });

    if (!stockOut) { await t.rollback(); return res.status(404).render('errors/404', { title: '404', currentPath: req.path }); }
    if (stockOut.status === 'confirmed') {
      await t.rollback();
      req.flash('error', 'Transaksi sudah dikonfirmasi.');
      return res.redirect(`/transaksi/keluar/${stockOut.id}`);
    }

    // Validate stock sufficiency & update in a single pass
    const productCache = {};
    for (const detail of stockOut.items) {
      const product = await Item.findByPk(detail.item_id, { lock: true, transaction: t });
      if (!product) {
        await t.rollback();
        req.flash('error', 'Barang tidak ditemukan.');
        return res.redirect(`/transaksi/keluar/${stockOut.id}`);
      }
      if (parseFloat(product.current_stock) < parseFloat(detail.quantity)) {
        await t.rollback();
        req.flash('error', `Stok ${product.name} tidak mencukupi. Tersedia: ${parseFloat(product.current_stock).toLocaleString('id-ID')}`);
        return res.redirect(`/transaksi/keluar/${stockOut.id}`);
      }
      productCache[detail.item_id] = product;
    }

    for (const detail of stockOut.items) {
      const product = productCache[detail.item_id];
      const stockBefore = parseFloat(product.current_stock);
      const stockAfter = stockBefore - parseFloat(detail.quantity);

      await product.update({ current_stock: stockAfter }, { transaction: t });
      await detail.update({ stock_before: stockBefore, stock_after: stockAfter }, { transaction: t });

      await StockMutation.create({
        item_id: product.id,
        type: 'out',
        quantity: parseFloat(detail.quantity),
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type: 'stock_out',
        reference_id: stockOut.id,
        created_by: req.session.user.id,
      }, { transaction: t });
    }

    await stockOut.update({
      status: 'confirmed',
      confirmed_at: new Date(),
      confirmed_by: req.session.user.id,
    }, { transaction: t });

    await t.commit();
    req.flash('success', 'Transaksi berhasil dikonfirmasi. Stok telah diperbarui.');
    res.redirect(`/transaksi/keluar/${stockOut.id}`);
  } catch (err) {
    await t.rollback();
    console.error(err);
    req.flash('error', err.message || 'Gagal mengkonfirmasi transaksi.');
    res.redirect(`/transaksi/keluar/${req.params.id}`);
  }
});

module.exports = router;
