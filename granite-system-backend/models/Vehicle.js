const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    licensePlate: {
        type: String,
        required: true,
        unique: true,
    },
    vehicleType: {
        type: String,
        required: true,
    },
    maxWeightCapacity: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Available', 'On Route', 'Maintenance'],
        default: 'Available',
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
