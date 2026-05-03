const router = require('express').Router();
const AuthController = require('../controllers/AuthController');

router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

module.exports = router;
