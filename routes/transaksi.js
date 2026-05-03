const router = require('express').Router();
const { isAuthenticated, checkRole } = require('../middleware/auth');
const StockController = require('../controllers/StockController');

// ═══════════════════════════════════════════════════
// STOCK IN — BARANG MASUK
// ═══════════════════════════════════════════════════
router.get('/masuk', isAuthenticated, StockController.indexMasuk);
router.get('/masuk/create', isAuthenticated, StockController.createMasuk);
router.post('/masuk', isAuthenticated, StockController.storeMasuk);
router.get('/masuk/:id', isAuthenticated, StockController.showMasuk);
router.get('/masuk/:id/confirm-action', isAuthenticated, checkRole('admin', 'owner'), StockController.confirmMasuk);

// ═══════════════════════════════════════════════════
// STOCK OUT — BARANG KELUAR
// ═══════════════════════════════════════════════════
router.get('/keluar', isAuthenticated, StockController.indexKeluar);
router.get('/keluar/create', isAuthenticated, StockController.createKeluar);
router.post('/keluar', isAuthenticated, StockController.storeKeluar);
router.get('/keluar/:id', isAuthenticated, StockController.showKeluar);
router.get('/keluar/:id/confirm-action', isAuthenticated, checkRole('admin', 'owner'), StockController.confirmKeluar);

module.exports = router;
