const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    }],
    totalPrice: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    customerPhone: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    preferredDeliveryDate: {
        type: Date,
        required: true,
    },
    unloadingAssistance: {
        type: Boolean,
        default: false,
    },
    specialInstructions: {
        type: String,
        default: '',
    },
    subtotal: {
        type: Number,
        required: true,
    },
    deliveryFee: {
        type: Number,
        required: true,
        default: 0,
    },
    tax: {
        type: Number,
        required: true,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered'],
        default: 'Pending',
    },
    paymentMethod: {
        type: String,
        enum: ['Card', 'Cash on Delivery'],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending',
    },
    cardLastFour: {
        type: String,
        default: null,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
