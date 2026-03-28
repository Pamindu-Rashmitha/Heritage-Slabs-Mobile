const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    stoneName: {
        type: String,
        required: [true, 'Stone name is required'],
        trim: true,
        minlength: [5, 'Stone name must be at least 5 characters'],
        maxlength: [20, 'Stone name cannot exceed 20 characters'],
    },
    pricePerSqFt: {
        type: Number,
        required: [true, 'Price per square foot is required'],
        min: [0, 'Price cannot be negative'],
    },
    stockInSqFt: {
        type: Number,
        required: [true, 'Stock in square feet is required'],
        min: [0, 'Stock cannot be negative'],
    },
    imageUrl: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);