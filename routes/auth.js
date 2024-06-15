const express = require('express');
const authController = require('../controllers/auth')
const router = express.Router();


router.post('/register', authController.register )

router.post('/login', authController.login )

router.get('/logout', authController.logout);


// routes that require authentication/have role-specific access
router.get('/dashboard', authController.authenticateUser(), authController.dashboard);
router.get('/clientList', authController.authenticateUser(), authController.clientList);
router.get('/clientInfo/:clientID', authController.authenticateUser(), authController.clientInfo);
router.get('/pickupInfo', authController.authenticateUser(), authController.pickupInfo);
router.get('/userDashboard', authController.authenticateUser('admin'), authController.userDashboard);
router.get('/editUser/:userID', authController.authenticateUser('admin'), authController.editUser);
router.post('/updateClient', authController.authenticateUser('admin'), authController.updateClient);
router.delete('/deleteUser/:userID', authController.authenticateUser('admin'), authController.deleteUser);
router.post('/updateUser', authController.authenticateUser('admin'), authController.updateUser);
router.get('/searchClients', authController.authenticateUser(), authController.searchClients);
router.get('/searchUsers', authController.authenticateUser('admin'), authController.searchUsers);

module.exports = router;





