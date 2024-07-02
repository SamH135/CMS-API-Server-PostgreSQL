// rgc.js
const express = require('express');
const router = express.Router();
const rgcController = require('../controllers/rgcController');
const { authenticateRGCToken } = require('../middleware/auth');

// Helper function to wrap route handlers
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Public routes
router.post('/login', asyncHandler(rgcController.rgcLogin));

// Apply RGC authentication to all routes below
router.use(authenticateRGCToken);

// Protected routes
router.get('/userList', rgcController.getUsers);
router.post('/createUser', rgcController.createUser);
router.get('/clientList', rgcController.clientList);
router.get('/searchClients', rgcController.searchClients);

// unused
router.get('/metal-prices', asyncHandler(rgcController.getMetalPrices));
router.post('/receipts', asyncHandler(rgcController.createReceipt));
router.get('/daily-totals', asyncHandler(rgcController.getDailyTotals));

module.exports = router;