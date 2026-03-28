const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Supplier',
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    quantityInSqFt: {
        type: Number,
        required: true,
    },
    unitCost: {
        type: Number,
        required: true,
    },
    totalCost: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Ordered', 'In Transit', 'Arrived', 'Cancelled'],
        default: 'Ordered',
    },
    expectedArrivalDate: {
        type: Date,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
