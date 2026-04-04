const express = require('express');
const router = express.Router();
const {productValidation, validate} = require('../middleware/validationMiddleware');
const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const {protect} = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').get(getProducts).post(protect, upload.array('images', 5), productValidation, validate, createProduct);
router.route('/review-order').post(protect, require('../controllers/productController').reviewOrder);
router.route('/:id').put(protect, upload.array('images', 5), productValidation, validate, updateProduct).delete(protect, deleteProduct);

module.exports = router;