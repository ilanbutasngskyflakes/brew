const express = require('express');
const router = express.Router();
const cashFlowController = require('../controllers/cashFlowController');

// GET routes
router.get('/', cashFlowController.getAllTransactions);
router.get('/summary', cashFlowController.getCashFlowSummary);
router.get('/daily-balance', cashFlowController.getDailyBalance);
router.get('/range', cashFlowController.getTransactionsByDateRange);
router.get('/type/:type', cashFlowController.getTransactionsByType);
router.get('/:id', cashFlowController.getTransactionById);

// POST routes
router.post('/', cashFlowController.createTransaction);

// PUT routes
router.put('/:id', cashFlowController.updateTransaction);

// DELETE routes
router.delete('/:id', cashFlowController.deleteTransaction);

module.exports = router;