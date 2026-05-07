const router = require('express').Router();
const AuthService = require('../services/AuthService');
const { isAuthenticated } = require('../middleware/auth');

// Auth API
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await AuthService.authenticate(email, password);
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    res.json({ message: 'Login successful', user: req.session.user });
  } catch (err) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logout successful' });
  });
});

router.get('/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Dashboard
const DashboardService = require('../services/DashboardService');
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try { res.json(await DashboardService.getDashboardData()); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Categories
const CategoryService = require('../services/CategoryService');
router.get('/categories', isAuthenticated, async (req, res) => {
  try {
    const categories = await CategoryService.getAllCategories();
    res.json(categories);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/categories/:id', isAuthenticated, async (req, res) => {
  try { res.json(await CategoryService.getCategoryById(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/categories', isAuthenticated, async (req, res) => {
  try { res.json(await CategoryService.createCategory(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/categories/:id', isAuthenticated, async (req, res) => {
  try { res.json(await CategoryService.updateCategory(req.params.id, req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/categories/:id', isAuthenticated, async (req, res) => {
  try { res.json(await CategoryService.deleteCategory(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Units
const UnitService = require('../services/UnitService');
router.get('/units', isAuthenticated, async (req, res) => {
  try { res.json(await UnitService.getAllUnits()); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/units/:id', isAuthenticated, async (req, res) => {
  try { res.json(await UnitService.getUnitById(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/units', isAuthenticated, async (req, res) => {
  try { res.json(await UnitService.createUnit(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/units/:id', isAuthenticated, async (req, res) => {
  try { res.json(await UnitService.updateUnit(req.params.id, req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/units/:id', isAuthenticated, async (req, res) => {
  try { res.json(await UnitService.deleteUnit(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Suppliers
const SupplierService = require('../services/SupplierService');
router.get('/suppliers', isAuthenticated, async (req, res) => {
  try { res.json(await SupplierService.getSuppliers(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/suppliers/:id', isAuthenticated, async (req, res) => {
  try { res.json(await SupplierService.getSupplierById(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/suppliers', isAuthenticated, async (req, res) => {
  try { res.json(await SupplierService.createSupplier(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/suppliers/:id', isAuthenticated, async (req, res) => {
  try { res.json(await SupplierService.updateSupplier(req.params.id, req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/suppliers/:id', isAuthenticated, async (req, res) => {
  try { res.json(await SupplierService.deleteSupplier(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Customers
const CustomerService = require('../services/CustomerService');
router.get('/customers', isAuthenticated, async (req, res) => {
  try { res.json(await CustomerService.getCustomers(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/customers/:id', isAuthenticated, async (req, res) => {
  try { res.json(await CustomerService.getCustomerById(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/customers', isAuthenticated, async (req, res) => {
  try { res.json(await CustomerService.createCustomer(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/customers/:id', isAuthenticated, async (req, res) => {
  try { res.json(await CustomerService.updateCustomer(req.params.id, req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/customers/:id', isAuthenticated, async (req, res) => {
  try { res.json(await CustomerService.deleteCustomer(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Items
const ItemService = require('../services/ItemService');
router.get('/items', isAuthenticated, async (req, res) => {
  try { res.json(await ItemService.getItems(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/items/form-data', isAuthenticated, async (req, res) => {
  try { res.json(await ItemService.getFormData()); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/items/search', isAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;
    const { Item, Unit } = require('../models');
    const { Op } = require('sequelize');
    const where = { is_active: true };
    if (q && q.trim()) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${q}%` } },
        { name: { [Op.iLike]: `%${q}%` } }
      ];
    }
    const items = await Item.findAll({
      where,
      include: [{ model: Unit, as: 'unit', attributes: ['abbr', 'name'] }],
      order: [['name', 'ASC']],
      limit: 30,
    });
    res.json(items.map(item => ({
      id: item.id,
      code: item.code,
      name: item.name,
      current_stock: item.current_stock,
      unit: item.unit ? item.unit.abbr : ''
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/items/:id', isAuthenticated, async (req, res) => {
  try { res.json(await ItemService.getItemById(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/items', isAuthenticated, async (req, res) => {
  try { res.json(await ItemService.createItem(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/items/:id', isAuthenticated, async (req, res) => {
  try { res.json(await ItemService.updateItem(req.params.id, req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/items/:id', isAuthenticated, async (req, res) => {
  try { res.json(await ItemService.deleteItem(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Stock In
const StockService = require('../services/StockService');
const StockRepository = require('../repositories/StockRepository');
router.get('/stock-in', isAuthenticated, async (req, res) => {
  try { res.json(await StockService.getStockInList(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/stock-in/form-data', isAuthenticated, async (req, res) => {
  try { 
    const data = await StockService.getStockInCreateData();
    const ItemService = require('../services/ItemService');
    const itemsData = await ItemService.getItems({ limit: 1000 });
    res.json({ ...data, items: itemsData.items || [] }); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/stock-in/:id', isAuthenticated, async (req, res) => {
  try {
    const stockIn = await StockRepository.findStockInById(req.params.id, true);
    if (!stockIn) return res.status(404).json({ error: 'Not found' });
    res.json(stockIn);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/stock-in', isAuthenticated, async (req, res) => {
  try {
    const stockIn = await StockService.createStockInDraft(req.body, req.session.user.id);
    res.json({ message: 'Draft berhasil disimpan', stockIn });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/stock-in/:id/confirm', isAuthenticated, async (req, res) => {
  try {
    if (!['admin', 'owner'].includes(req.session.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const stockIn = await StockService.confirmStockIn(req.params.id, req.session.user.id);
    res.json({ message: 'Transaksi berhasil dikonfirmasi', stockIn });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Stock Position & History
const StockPositionService = require('../services/StockPositionService');
const StockHistoryService = require('../services/StockHistoryService');
router.get('/stock', isAuthenticated, async (req, res) => {
  try { res.json(await StockPositionService.getStockPosition(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/stock/:id/history', isAuthenticated, async (req, res) => {
  try { res.json(await StockHistoryService.getHistory(req.params.id, req.query)); } catch (err) { res.status(404).json({ error: err.message }); }
});

// Stock Out
router.get('/stock-out', isAuthenticated, async (req, res) => {
  try { res.json(await StockService.getStockOutList(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/stock-out/form-data', isAuthenticated, async (req, res) => {
  try { 
    const data = await StockService.getStockOutCreateData();
    const ItemService = require('../services/ItemService');
    const itemsData = await ItemService.getItems({ limit: 1000 });
    res.json({ ...data, items: itemsData.items || [] }); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/stock-out/:id', isAuthenticated, async (req, res) => {
  try {
    const stockOut = await StockRepository.findStockOutById(req.params.id, true);
    if (!stockOut) return res.status(404).json({ error: 'Not found' });
    res.json(stockOut);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/stock-out', isAuthenticated, async (req, res) => {
  try {
    const stockOut = await StockService.createStockOutDraft(req.body, req.session.user.id);
    res.json({ message: 'Draft berhasil disimpan', stockOut });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/stock-out/:id/confirm', isAuthenticated, async (req, res) => {
  try {
    if (!['admin', 'owner'].includes(req.session.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const stockOut = await StockService.confirmStockOut(req.params.id, req.session.user.id);
    res.json({ message: 'Transaksi berhasil dikonfirmasi', stockOut });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Reports
const ReportService = require('../services/ReportService');
router.get('/reports/stock', isAuthenticated, async (req, res) => {
  try { res.json(await ReportService.getStockReport(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/reports/stock-in', isAuthenticated, async (req, res) => {
  try { res.json(await ReportService.getStockInReport(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/reports/stock-out', isAuthenticated, async (req, res) => {
  try { res.json(await ReportService.getStockOutReport(req.query)); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Warehouse
const WarehouseController = require('../controllers/WarehouseController');
router.get('/warehouse/layout', isAuthenticated, WarehouseController.getLayout);
router.post('/warehouse/layout', isAuthenticated, WarehouseController.saveLayout);
router.get('/warehouse/slots', isAuthenticated, WarehouseController.getSlots);
router.get('/warehouse/slots/:id/history', isAuthenticated, WarehouseController.getHistory);
router.post('/warehouse/move', isAuthenticated, WarehouseController.moveStock);

// Excel Reports
const ReportController = require('../controllers/ReportController');
router.get('/reports/export/items', isAuthenticated, ReportController.downloadRekapItem);
router.get('/reports/export/customers', isAuthenticated, ReportController.downloadRekapCustomer);
router.get('/reports/export/suppliers', isAuthenticated, ReportController.downloadRekapSupplier);
router.get('/reports/export/daily', isAuthenticated, ReportController.downloadRekapHarian);

// Profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try { res.json(await AuthService.getUserById(req.session.user.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const updatedUser = await AuthService.updateProfile(req.session.user.id, req.body);
    req.session.user.name = updatedUser.name;
    req.session.user.email = updatedUser.email;
    res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// User Management (owner only)
const { checkRole } = require('../middleware/auth');
router.get('/users', isAuthenticated, checkRole('owner'), async (req, res) => {
  try { res.json(await AuthService.getAllUsers()); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/users/:id', isAuthenticated, checkRole('owner'), async (req, res) => {
  try {
    const user = await AuthService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/users', isAuthenticated, checkRole('owner'), async (req, res) => {
  try { res.json(await AuthService.createUser(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/users/:id', isAuthenticated, checkRole('owner'), async (req, res) => {
  try {
    const result = await AuthService.updateUser(req.params.id, req.body);
    if (!result) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil diperbarui' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

