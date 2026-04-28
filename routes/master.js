const router = require('express').Router();
const { isAuthenticated, checkRole } = require('../middleware/auth');
const { Item, Category, Unit, Supplier, Customer } = require('../models');
const { Op } = require('sequelize');

// ═══════════════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════════════
router.get('/items', isAuthenticated, async (req, res) => {
  try {
    const { search, category_id, status, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
      ];
    }
    if (category_id) where.category_id = category_id;

    const { sequelize } = require('../models');
    let order = [['name', 'ASC']];
    let extraWhere = {};

    if (status === 'critical') {
      extraWhere = sequelize.literal('current_stock <= minimum_stock AND minimum_stock > 0');
    } else if (status === 'safe') {
      extraWhere = sequelize.literal('(current_stock > minimum_stock OR minimum_stock = 0)');
    }

    const { count, rows: items } = await Item.findAndCountAll({
      where: extraWhere ? { ...where, [Op.and]: extraWhere } : where,
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' },
      ],
      order,
      limit,
      offset,
    });

    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    const totalPages = Math.ceil(count / limit);

    res.render('master/items/index', {
      title: 'Master Barang — TAKKA STEEL',
      items, categories, count,
      currentPage: parseInt(page), totalPages,
      search: search || '', category_id: category_id || '', status: status || '',
      currentPath: '/master/items',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat data barang.');
    res.redirect('/');
  }
});

router.get('/items/create', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  const units = await Unit.findAll({ order: [['name', 'ASC']] });
  res.render('master/items/form', {
    title: 'Tambah Barang — TAKKA STEEL',
    item: null, categories, units,
    currentPath: '/master/items',
  });
});

router.post('/items', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const { code, name, category_id, unit_id, current_stock, minimum_stock, description } = req.body;
    await Item.create({
      code, name, category_id, unit_id,
      current_stock: parseFloat(current_stock) || 0,
      minimum_stock: parseFloat(minimum_stock) || 0,
      description,
    });
    req.flash('success', 'Barang berhasil ditambahkan.');
    res.redirect('/master/items');
  } catch (err) {
    console.error(err);
    req.flash('error', err.message || 'Gagal menambah barang.');
    res.redirect('/master/items/create');
  }
});

router.get('/items/:id/edit', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  const units = await Unit.findAll({ order: [['name', 'ASC']] });
  res.render('master/items/form', {
    title: 'Edit Barang — TAKKA STEEL',
    item, categories, units,
    currentPath: '/master/items',
  });
});

router.put('/items/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
    const { code, name, category_id, unit_id, minimum_stock, description } = req.body;
    await item.update({ code, name, category_id, unit_id, minimum_stock: parseFloat(minimum_stock) || 0, description });
    req.flash('success', 'Barang berhasil diperbarui.');
    res.redirect('/master/items');
  } catch (err) {
    console.error(err);
    req.flash('error', err.message || 'Gagal memperbarui barang.');
    res.redirect(`/master/items/${req.params.id}/edit`);
  }
});

router.delete('/items/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (item) await item.update({ is_active: false });
    req.flash('success', 'Barang berhasil dinonaktifkan.');
    res.redirect('/master/items');
  } catch (err) {
    req.flash('error', 'Gagal menghapus barang.');
    res.redirect('/master/items');
  }
});

// ═══════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════
router.get('/suppliers', isAuthenticated, async (req, res) => {
  const { search, page = 1 } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;
  const where = {};
  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ];
  }
  const { count, rows: suppliers } = await Supplier.findAndCountAll({ where, order: [['name', 'ASC']], limit, offset });
  res.render('master/suppliers/index', {
    title: 'Master Supplier — TAKKA STEEL',
    suppliers, count,
    currentPage: parseInt(page), totalPages: Math.ceil(count / limit),
    search: search || '',
    currentPath: '/master/suppliers',
  });
});

router.get('/suppliers/create', isAuthenticated, checkRole('admin', 'owner'), (req, res) => {
  res.render('master/suppliers/form', { title: 'Tambah Supplier', supplier: null, currentPath: '/master/suppliers' });
});

router.post('/suppliers', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    await Supplier.create(req.body);
    req.flash('success', 'Supplier berhasil ditambahkan.');
    res.redirect('/master/suppliers');
  } catch (err) {
    req.flash('error', err.message || 'Gagal menambah supplier.');
    res.redirect('/master/suppliers/create');
  }
});

router.get('/suppliers/:id/edit', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  const supplier = await Supplier.findByPk(req.params.id);
  if (!supplier) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
  res.render('master/suppliers/form', { title: 'Edit Supplier', supplier, currentPath: '/master/suppliers' });
});

router.put('/suppliers/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
    await supplier.update(req.body);
    req.flash('success', 'Supplier berhasil diperbarui.');
    res.redirect('/master/suppliers');
  } catch (err) {
    req.flash('error', err.message || 'Gagal memperbarui supplier.');
    res.redirect(`/master/suppliers/${req.params.id}/edit`);
  }
});

router.delete('/suppliers/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (supplier) await supplier.update({ is_active: false });
    req.flash('success', 'Supplier berhasil dinonaktifkan.');
    res.redirect('/master/suppliers');
  } catch (err) {
    req.flash('error', 'Gagal menghapus supplier.');
    res.redirect('/master/suppliers');
  }
});

// ═══════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════
router.get('/customers', isAuthenticated, async (req, res) => {
  const { search, page = 1 } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;
  const where = {};
  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ];
  }
  const { count, rows: customers } = await Customer.findAndCountAll({ where, order: [['name', 'ASC']], limit, offset });
  res.render('master/customers/index', {
    title: 'Master Customer — TAKKA STEEL',
    customers, count,
    currentPage: parseInt(page), totalPages: Math.ceil(count / limit),
    search: search || '',
    currentPath: '/master/customers',
  });
});

router.get('/customers/create', isAuthenticated, checkRole('admin', 'owner'), (req, res) => {
  res.render('master/customers/form', { title: 'Tambah Customer', customer: null, currentPath: '/master/customers' });
});

router.post('/customers', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    await Customer.create(req.body);
    req.flash('success', 'Customer berhasil ditambahkan.');
    res.redirect('/master/customers');
  } catch (err) {
    req.flash('error', err.message || 'Gagal menambah customer.');
    res.redirect('/master/customers/create');
  }
});

router.get('/customers/:id/edit', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
  res.render('master/customers/form', { title: 'Edit Customer', customer, currentPath: '/master/customers' });
});

router.put('/customers/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
    await customer.update(req.body);
    req.flash('success', 'Customer berhasil diperbarui.');
    res.redirect('/master/customers');
  } catch (err) {
    req.flash('error', err.message || 'Gagal memperbarui customer.');
    res.redirect(`/master/customers/${req.params.id}/edit`);
  }
});

router.delete('/customers/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (customer) await customer.update({ is_active: false });
    req.flash('success', 'Customer berhasil dinonaktifkan.');
    res.redirect('/master/customers');
  } catch (err) {
    req.flash('error', 'Gagal menghapus customer.');
    res.redirect('/master/customers');
  }
});

// ═══════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════
router.get('/categories', isAuthenticated, async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  res.render('master/categories/index', {
    title: 'Master Kategori — TAKKA STEEL',
    categories,
    currentPath: '/master/categories',
  });
});

router.get('/categories/create', isAuthenticated, checkRole('admin', 'owner'), (req, res) => {
  res.render('master/categories/form', { title: 'Tambah Kategori', category: null, currentPath: '/master/categories' });
});

router.post('/categories', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    await Category.create({ name, slug });
    req.flash('success', 'Kategori berhasil ditambahkan.');
    res.redirect('/master/categories');
  } catch (err) {
    req.flash('error', err.message || 'Gagal menambah kategori.');
    res.redirect('/master/categories/create');
  }
});

router.get('/categories/:id/edit', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
  res.render('master/categories/form', { title: 'Edit Kategori', category, currentPath: '/master/categories' });
});

router.put('/categories/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    await category.update({ name, slug });
    req.flash('success', 'Kategori berhasil diperbarui.');
    res.redirect('/master/categories');
  } catch (err) {
    req.flash('error', err.message || 'Gagal memperbarui kategori.');
    res.redirect(`/master/categories/${req.params.id}/edit`);
  }
});

router.delete('/categories/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    await Category.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Kategori berhasil dihapus.');
    res.redirect('/master/categories');
  } catch (err) {
    req.flash('error', 'Gagal menghapus kategori. Pastikan tidak ada barang yang menggunakan kategori ini.');
    res.redirect('/master/categories');
  }
});

// ═══════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════
router.get('/units', isAuthenticated, async (req, res) => {
  const units = await Unit.findAll({ order: [['name', 'ASC']] });
  res.render('master/units/index', {
    title: 'Master Satuan — TAKKA STEEL',
    units,
    currentPath: '/master/units',
  });
});

router.get('/units/create', isAuthenticated, checkRole('admin', 'owner'), (req, res) => {
  res.render('master/units/form', { title: 'Tambah Satuan', unit: null, currentPath: '/master/units' });
});

router.post('/units', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    await Unit.create(req.body);
    req.flash('success', 'Satuan berhasil ditambahkan.');
    res.redirect('/master/units');
  } catch (err) {
    req.flash('error', err.message || 'Gagal menambah satuan.');
    res.redirect('/master/units/create');
  }
});

router.get('/units/:id/edit', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  const unit = await Unit.findByPk(req.params.id);
  if (!unit) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
  res.render('master/units/form', { title: 'Edit Satuan', unit, currentPath: '/master/units' });
});

router.put('/units/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
    await unit.update(req.body);
    req.flash('success', 'Satuan berhasil diperbarui.');
    res.redirect('/master/units');
  } catch (err) {
    req.flash('error', err.message || 'Gagal memperbarui satuan.');
    res.redirect(`/master/units/${req.params.id}/edit`);
  }
});

router.delete('/units/:id', isAuthenticated, checkRole('admin', 'owner'), async (req, res) => {
  try {
    await Unit.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Satuan berhasil dihapus.');
    res.redirect('/master/units');
  } catch (err) {
    req.flash('error', 'Gagal menghapus satuan. Pastikan tidak ada barang yang menggunakan satuan ini.');
    res.redirect('/master/units');
  }
});

module.exports = router;
