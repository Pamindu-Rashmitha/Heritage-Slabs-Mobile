const express = require('express');
const router = express.Router();
const { deliveryValidation, validate } = require('../middleware/validationMiddleware');
const {
    createDelivery,
    getDeliveries,
    getDeliveryById,
    updateDelivery,
    deleteDelivery
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getDeliveries).post(protect, deliveryValidation, validate, createDelivery);
router.route('/:id').get(protect, getDeliveryById).put(protect, updateDelivery).delete(protect, deleteDelivery);

module.exports = router;
