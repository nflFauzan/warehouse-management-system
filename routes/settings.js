const router = require('express').Router();
const { isAuthenticated, checkRole } = require('../middleware/auth');
const AuthController = require('../controllers/AuthController');

// ─── USER MANAGEMENT ────────────────────────────────
router.get('/users', isAuthenticated, checkRole('owner'), AuthController.indexUsers);
router.get('/users/create', isAuthenticated, checkRole('owner'), AuthController.createUsers);
router.post('/users', isAuthenticated, checkRole('owner'), AuthController.storeUsers);
router.get('/users/:id/edit', isAuthenticated, checkRole('owner'), AuthController.editUsers);
router.put('/users/:id', isAuthenticated, checkRole('owner'), AuthController.updateUsers);

// ─── PROFILE ────────────────────────────────────────
router.get('/profile', isAuthenticated, AuthController.showProfile);
router.put('/profile', isAuthenticated, AuthController.updateProfile);

module.exports = router;
