const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order',
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Vehicle',
    },
    driverName: {
        type: String,
        required: true,
    },
    expectedDeliveryDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Scheduled', 'In Transit', 'Completed'],
        default: 'Scheduled',
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
