const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/dashboard', authController.authenticateToken, authController.dashboard);
router.get('/clientList', authController.authenticateToken, authController.clientList);
router.get('/clientInfo/:clientID', authController.authenticateToken, authController.clientInfo);
router.get('/pickupInfo', authController.authenticateToken, authController.pickupInfo);
router.get('/userDashboard', authController.authenticateToken, authController.authorizeRole('admin'), authController.userDashboard);
router.get('/editUser/:userID', authController.authenticateToken, authController.authorizeRole('admin'), authController.editUser);
router.post('/updateClient', authController.authenticateToken, authController.authorizeRole('admin'), authController.updateClient);
router.delete('/deleteUser/:userID', authController.authenticateToken, authController.authorizeRole('admin'), authController.deleteUser);
router.post('/updateUser', authController.authenticateToken, authController.authorizeRole('admin'), authController.updateUser);
router.get('/searchClients', authController.authenticateToken, authController.searchClients);
router.get('/searchUsers', authController.authenticateToken, authController.authorizeRole('admin'), authController.searchUsers);

module.exports = router;