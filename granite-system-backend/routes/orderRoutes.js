const express = require('express');
const router = express.Router();
const { orderValidation, validate } = require('../middleware/validationMiddleware');
const {
    createOrder,
    getOrders,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getOrders).post(protect, createOrder);
router.route('/my').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).put(protect, updateOrderStatus).delete(protect, deleteOrder);

module.exports = router;
