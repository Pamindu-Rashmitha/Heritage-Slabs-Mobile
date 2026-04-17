const Order = require('../models/Order');
const Product = require('../models/Product');

const isOnlyNumbers = (str) => /^\d+$/.test(str.trim());
const addressRegex = /^\d+,\s*.+,\s*.+$/;
const phoneRegex = /^0\d{9}$/;
const ALLOWED_CITIES = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle', 'Matara',
    'Negombo', 'Jaffna', 'Anuradhapura', 'Kurunegala', 'Other'
];

const createOrder = async (req, res) => {
    try {
        const {
            products,
            totalPrice,
            shippingAddress,
            paymentMethod,
            cardLastFour,
            customerPhone,
            city,
            preferredDeliveryDate,
            unloadingAssistance,
            specialInstructions,
            subtotal,
            deliveryFee,
            tax,
        } = req.body;

        const userId = req.user.id;

        if (!products || !totalPrice || !shippingAddress || !paymentMethod || !customerPhone || !city || !preferredDeliveryDate) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'At least one product is required' });
        }

        if (totalPrice <= 0) {
            return res.status(400).json({ message: 'Total price must be greater than 0' });
        }

        if (shippingAddress.trim().length < 5) {
            return res.status(400).json({ message: 'Shipping address must be at least 5 characters' });
        }

        if (!addressRegex.test(shippingAddress.trim())) {
            return res.status(400).json({ message: 'Address must follow the format: Street Number, Street Name, City (e.g. 123, Main Street, Colombo)' });
        }

        if (!phoneRegex.test(customerPhone.trim())) {
            return res.status(400).json({ message: 'Phone number must be 10 digits starting with 0 (e.g. 0771234567)' });
        }

        if (!ALLOWED_CITIES.includes(city)) {
            return res.status(400).json({ message: 'Invalid city selection' });
        }

        const deliveryDate = new Date(preferredDeliveryDate);
        if (isNaN(deliveryDate.getTime())) {
            return res.status(400).json({ message: 'Preferred delivery date is invalid' });
        }
        const now = new Date();
        const minDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        minDate.setHours(0, 0, 0, 0);
        maxDate.setHours(23, 59, 59, 999);
        if (deliveryDate < minDate) {
            return res.status(400).json({ message: 'Preferred delivery date must be at least 2 days from today' });
        }
        if (deliveryDate > maxDate) {
            return res.status(400).json({ message: 'Preferred delivery date cannot be more than 30 days from today' });
        }

        if (specialInstructions && typeof specialInstructions === 'string' && specialInstructions.length > 500) {
            return res.status(400).json({ message: 'Special instructions cannot exceed 500 characters' });
        }

        if (typeof subtotal !== 'number' || subtotal <= 0) {
            return res.status(400).json({ message: 'Subtotal must be a positive number' });
        }
        if (typeof deliveryFee !== 'number' || deliveryFee < 0) {
            return res.status(400).json({ message: 'Delivery fee must be a non-negative number' });
        }
        if (typeof tax !== 'number' || tax < 0) {
            return res.status(400).json({ message: 'Tax must be a non-negative number' });
        }

        const validPaymentMethods = ['Card', 'Cash on Delivery'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        let paymentStatus = 'Pending';
        if (paymentMethod === 'Card') {
            if (!cardLastFour || cardLastFour.length !== 4) {
                return res.status(400).json({ message: 'Card details are required for card payment' });
            }
            paymentStatus = 'Paid';
        }

        // Validate stock and deduct for each product
        const productIds = [];
        const qtyMap = {};

        for (const item of products) {
            if (typeof item === 'object' && item.productId) {
                productIds.push(item.productId);
                qtyMap[item.productId] = item.qty || 1;
            } else {

                productIds.push(item);
                qtyMap[item] = 1;
            }
        }

        // Check stock availability
        for (const pid of productIds) {
            const product = await Product.findById(pid);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${pid}` });
            }
            const qtyNeeded = qtyMap[pid];
            if (product.stockInSqFt < qtyNeeded) {
                return res.status(400).json({ message: `Insufficient stock for ${product.stoneName}. Available: ${product.stockInSqFt} SqFt, Requested: ${qtyNeeded} SqFt` });
            }
        }

        // Deduct stock
        for (const pid of productIds) {
            await Product.findByIdAndUpdate(pid, {
                $inc: { stockInSqFt: -qtyMap[pid] }
            });
        }

        const order = await Order.create({
            user: userId,
            products: productIds,
            totalPrice,
            shippingAddress,
            customerPhone: customerPhone.trim(),
            city,
            preferredDeliveryDate: deliveryDate,
            unloadingAssistance: Boolean(unloadingAssistance),
            specialInstructions: (specialInstructions || '').trim(),
            subtotal,
            deliveryFee,
            tax,
            paymentMethod,
            paymentStatus,
            cardLastFour: paymentMethod === 'Card' ? cardLastFour : null,
        });

        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email')
            .populate('products', 'stoneName pricePerSqFt')
            .sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('products', 'stoneName pricePerSqFt imageUrls')
            .sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('products', 'stoneName pricePerSqFt');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const { status, paymentStatus } = req.body;
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
        const validPaymentStatuses = ['Pending', 'Paid', 'Failed'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status value' });
        }

        order.status = status || order.status;
        order.paymentStatus = paymentStatus || order.paymentStatus;
        const updatedOrder = await order.save();

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Order deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createOrder, getOrders, getMyOrders, getOrderById, updateOrderStatus, deleteOrder };
