const express = require('express');
const router = express.Router();
const { purchaseOrderValidation, validate } = require('../middleware/validationMiddleware');
const {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder
} = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getPurchaseOrders).post(protect, purchaseOrderValidation, validate, createPurchaseOrder);
router.route('/:id').get(protect, getPurchaseOrderById).put(protect, updatePurchaseOrder).delete(protect, deletePurchaseOrder);

module.exports = router;
