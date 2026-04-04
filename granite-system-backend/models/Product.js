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
    imageUrls: {
        type: [String],
        default: []
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: [
        {
            user: { type: String, required: true },
            text: { type: String, required: true },
            rating: { type: Number, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);