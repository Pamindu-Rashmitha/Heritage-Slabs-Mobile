const Product = require('../models/Product');

const createProduct = async (req, res) => {
    try {
        const { stoneName, pricePerSqFt, stockInSqFt } = req.body;
        const imagePath = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

        const product = await Product.create({
            user: req.user.id,
            stoneName,
            pricePerSqFt,
            stockInSqFt,
            imageUrl: imagePath,
        });

        res.status(201).json(product);

    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A product with this stone name already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Only allow whitelisted fields to be updated
        const allowedFields = ['stoneName', 'pricePerSqFt', 'stockInSqFt', 'imageUrl'];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A product with this stone name already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Product deleted' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createProduct, getProducts, updateProduct, deleteProduct };