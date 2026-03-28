const express = require('express');
const router = express.Router();
const { supplierValidation, validate } = require('../middleware/validationMiddleware');
const {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getSuppliers).post(protect, supplierValidation, validate, createSupplier);
router.route('/:id').get(protect, getSupplierById).put(protect, supplierValidation, validate, updateSupplier).delete(protect, deleteSupplier);

module.exports = router;
