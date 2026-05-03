const express = require('express');
const router = express.Router();
const {productValidation, validate} = require('../middleware/validationMiddleware');
const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    reviewOrder
} = require('../controllers/productController');
const {protect, adminOnly} = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').get(getProducts).post(protect, adminOnly, upload.array('images', 5), productValidation, validate, createProduct);
router.route('/review-order').post(protect,reviewOrder);
router.route('/:id').put(protect, adminOnly, upload.array('images', 5), productValidation, validate, updateProduct).delete(protect, adminOnly, deleteProduct);

module.exports = router;