const router = require('express').Router();
const { isAuthenticated, checkRole } = require('../middleware/auth');
const { Item, Category, Unit, Supplier, Customer } = require('../models');
const { Op } = require('sequelize');

const CategoryController = require('../controllers/CategoryController');
const UnitController = require('../controllers/UnitController');
const SupplierController = require('../controllers/SupplierController');
const CustomerController = require('../controllers/CustomerController');
const ItemController = require('../controllers/ItemController');

// ═══════════════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════════════
router.get('/items', isAuthenticated, ItemController.index);
router.get('/items/create', isAuthenticated, checkRole('admin', 'owner'), ItemController.create);
router.post('/items', isAuthenticated, checkRole('admin', 'owner'), ItemController.store);
router.get('/items/:id/edit', isAuthenticated, checkRole('admin', 'owner'), ItemController.edit);
router.put('/items/:id', isAuthenticated, checkRole('admin', 'owner'), ItemController.update);
router.delete('/items/:id', isAuthenticated, checkRole('admin', 'owner'), ItemController.destroy);

// ═══════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════
router.get('/suppliers', isAuthenticated, SupplierController.index);
router.get('/suppliers/create', isAuthenticated, checkRole('admin', 'owner'), SupplierController.create);
router.post('/suppliers', isAuthenticated, checkRole('admin', 'owner'), SupplierController.store);
router.get('/suppliers/:id/edit', isAuthenticated, checkRole('admin', 'owner'), SupplierController.edit);
router.put('/suppliers/:id', isAuthenticated, checkRole('admin', 'owner'), SupplierController.update);
router.delete('/suppliers/:id', isAuthenticated, checkRole('admin', 'owner'), SupplierController.destroy);

// ═══════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════
router.get('/customers', isAuthenticated, CustomerController.index);
router.get('/customers/create', isAuthenticated, checkRole('admin', 'owner'), CustomerController.create);
router.post('/customers', isAuthenticated, checkRole('admin', 'owner'), CustomerController.store);
router.get('/customers/:id/edit', isAuthenticated, checkRole('admin', 'owner'), CustomerController.edit);
router.put('/customers/:id', isAuthenticated, checkRole('admin', 'owner'), CustomerController.update);
router.delete('/customers/:id', isAuthenticated, checkRole('admin', 'owner'), CustomerController.destroy);

// ═══════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════
router.get('/categories', isAuthenticated, CategoryController.index);
router.get('/categories/create', isAuthenticated, checkRole('admin', 'owner'), CategoryController.create);
router.post('/categories', isAuthenticated, checkRole('admin', 'owner'), CategoryController.store);
router.get('/categories/:id/edit', isAuthenticated, checkRole('admin', 'owner'), CategoryController.edit);
router.put('/categories/:id', isAuthenticated, checkRole('admin', 'owner'), CategoryController.update);
router.delete('/categories/:id', isAuthenticated, checkRole('admin', 'owner'), CategoryController.destroy);

// ═══════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════
router.get('/units', isAuthenticated, UnitController.index);
router.get('/units/create', isAuthenticated, checkRole('admin', 'owner'), UnitController.create);
router.post('/units', isAuthenticated, checkRole('admin', 'owner'), UnitController.store);
router.get('/units/:id/edit', isAuthenticated, checkRole('admin', 'owner'), UnitController.edit);
router.put('/units/:id', isAuthenticated, checkRole('admin', 'owner'), UnitController.update);
router.delete('/units/:id', isAuthenticated, checkRole('admin', 'owner'), UnitController.destroy);

module.exports = router;
