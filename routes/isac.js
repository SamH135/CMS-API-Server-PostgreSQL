const express = require('express');
const router = express.Router();
const isacController = require('../controllers/isacController');
const { authenticateISACToken, authorizeRole } = require('../middleware/auth');

// Helper function to wrap route handlers
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Public routes
router.post('/register', asyncHandler(isacController.register));
router.post('/login', asyncHandler(isacController.login));

// Apply ISAC authentication to all routes below
router.use(authenticateISACToken);

// Protected routes
router.get('/dashboard', asyncHandler(isacController.dashboard));

// Client Routes
router.get('/clientList', asyncHandler(isacController.clientList));
router.get('/clientInfo/:clientID', asyncHandler(isacController.clientInfo));
router.get('/pickupInfo', asyncHandler(isacController.pickupInfo));
router.get('/searchClients', asyncHandler(isacController.searchClients));
router.get('/clientMetals/:clientID', asyncHandler(isacController.getClientMetals));
router.get('/clientTotals/:clientID', asyncHandler(isacController.getClientTotals));

// Receipt and metal routes
router.get('/receiptList', asyncHandler(isacController.receiptList));
router.get('/receiptInfo/:receiptID', asyncHandler(isacController.receiptInfo));
router.get('/searchReceipts', asyncHandler(isacController.searchReceipts));
router.get('/receiptMetals/:receiptID', asyncHandler(isacController.receiptMetals));
router.get('/customMetals/:receiptID', asyncHandler(isacController.customMetals));
router.get('/catalyticConverters/:receiptID', asyncHandler(isacController.catalyticConverters));
router.get('/getReceiptByClientAndDate', asyncHandler(isacController.getReceiptByClientAndDate));

// Request routes
router.get('/requests', asyncHandler(isacController.getRequests));
router.get('/requests/:requestID', asyncHandler(isacController.getRequestById));
router.post('/requests', asyncHandler(isacController.createRequest));
router.put('/requests/:requestID', asyncHandler(isacController.updateRequest));

// route info - pickup info routes
router.get('/searchPickups', asyncHandler(isacController.searchPickups));

// price routes
router.get('/view-prices', asyncHandler(isacController.getViewPrices));

// truck-load routes
router.get('/truckLoads', asyncHandler(isacController.getTruckLoads));

// Admin-only routes
router.use(authorizeRole('admin'));
router.get('/userDashboard', asyncHandler(isacController.userDashboard));
router.get('/editUser/:userID', asyncHandler(isacController.editUser));
router.post('/updateClient', asyncHandler(isacController.updateClient));
router.delete('/deleteUser/:userID', asyncHandler(isacController.deleteUser));
router.post('/updateUser', asyncHandler(isacController.updateUser));
router.get('/searchUsers', asyncHandler(isacController.searchUsers));
router.post('/addClient', authenticateISACToken, authorizeRole('admin'), asyncHandler(isacController.addClient));

router.delete('/deleteRequests', asyncHandler(isacController.deleteMultipleRequests));

router.get('/hvac-prices', asyncHandler(isacController.getHVACPrices));
router.post('/hvac-prices', asyncHandler(isacController.setHVACPrices));
router.get('/auto-prices', asyncHandler(isacController.getAutoPrices));
router.post('/auto-prices', asyncHandler(isacController.setAutoPrices));
router.post('/update-shred-steel-price', asyncHandler(isacController.updateShredSteelPrice));
router.post('/adjustInsulationFee', asyncHandler(isacController.adjustInsulationFee));

// Data analytic routes - these are currently not being used
router.get('/top-clients-by-metal', asyncHandler(isacController.getTopClientsByMetal));
router.get('/top-clients-by-volume', asyncHandler(isacController.getTopClientsByVolume));

// Last pickup date update routes - (needs to be implemented)
router.put('/update-last-pickup/:clientID', asyncHandler(isacController.updateLastPickupDate));
router.put('/manual-update-pickup/:clientID', asyncHandler(isacController.manualUpdatePickupDate));

module.exports = router;