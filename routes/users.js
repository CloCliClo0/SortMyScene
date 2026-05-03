const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/profile', requireAuth, userController.getProfile);
router.get('/', requireAuth, requireAdmin, userController.getAllUsers);
router.get('/:id', requireAuth, userController.getUserById);
router.put('/:id', requireAuth, userController.updateUser);
router.delete('/:id', requireAuth, userController.deleteUser);

module.exports = router;
