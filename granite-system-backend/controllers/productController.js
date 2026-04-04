const Product = require('../models/Product');

const createProduct = async (req, res) => {
    try {
        const { stoneName, pricePerSqFt, stockInSqFt } = req.body;
        const imageUrls = req.files ? req.files.map(file => `/${file.path.replace(/\\/g, '/')}`) : [];

        const product = await Product.create({
            user: req.user.id,
            stoneName,
            pricePerSqFt,
            stockInSqFt,
            imageUrls,
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
        const allowedFields = ['stoneName', 'pricePerSqFt', 'stockInSqFt', 'imageUrls', 'rating', 'reviews'];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        // If new files are uploaded, update imageUrls
        if (req.files && req.files.length > 0) {
            updateData.imageUrls = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`);
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

const reviewOrder = async (req, res) => {
    try {
        const { orderId, subject, description, rating } = req.body;
        const Order = require('../models/Order'); // Local import to avoid circular dependency if any
        const User = require('../models/User');
        
        const order = await Order.findById(orderId).populate('products');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const user = await User.findById(req.user.id);
        const reviewText = subject ? `${subject} - ${description}` : description;
        
        const review = {
            user: user.name,
            text: reviewText,
            rating: Number(rating) || 5,
            createdAt: new Date()
        };

        for (const product of order.products) {
            const prod = await Product.findById(product._id);
            if (prod) {
                prod.reviews.push(review);
                
                // Recalculate average rating
                const totalRating = prod.reviews.reduce((acc, r) => acc + r.rating, 0);
                prod.rating = totalRating / prod.reviews.length;
                
                await prod.save();
            }
        }

        res.status(200).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createProduct, getProducts, updateProduct, deleteProduct, reviewOrder };