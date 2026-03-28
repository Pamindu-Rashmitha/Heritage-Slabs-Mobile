const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

const createPurchaseOrder = async (req, res) => {
    try {
        const { supplier, product, quantityInSqFt, unitCost, expectedArrivalDate } = req.body;

        if (!supplier || !product || !quantityInSqFt || !unitCost) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        if (quantityInSqFt <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        if (unitCost <= 0) {
            return res.status(400).json({ message: 'Unit cost must be greater than 0' });
        }

        const totalCost = quantityInSqFt * unitCost;

        const po = await PurchaseOrder.create({
            supplier,
            product,
            quantityInSqFt,
            unitCost,
            totalCost,
            expectedArrivalDate: expectedArrivalDate || null,
        });

        res.status(201).json(po);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPurchaseOrders = async (req, res) => {
    try {
        const purchaseOrders = await PurchaseOrder.find({})
            .populate('supplier', 'companyName contactPerson')
            .populate('product', 'stoneName stockInSqFt pricePerSqFt')
            .sort({ createdAt: -1 });
        res.status(200).json({ purchaseOrders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPurchaseOrderById = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('supplier', 'companyName contactPerson email phone')
            .populate('product', 'stoneName stockInSqFt pricePerSqFt');

        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        res.status(200).json(po);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updatePurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);

        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        const { status } = req.body;
        const validStatuses = ['Ordered', 'In Transit', 'Arrived', 'Cancelled'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const oldStatus = po.status;
        po.status = status || po.status;

        const updatedPO = await po.save();

        // Auto-update stock when status changes to Arrived
        if (status === 'Arrived' && oldStatus !== 'Arrived') {
            await Product.findByIdAndUpdate(po.product, {
                $inc: { stockInSqFt: po.quantityInSqFt }
            });
        }

        // If reverting from Arrived to another status, decrement stock
        if (oldStatus === 'Arrived' && status !== 'Arrived') {
            await Product.findByIdAndUpdate(po.product, {
                $inc: { stockInSqFt: -po.quantityInSqFt }
            });
        }

        res.status(200).json(updatedPO);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deletePurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);

        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        // If PO was arrived, decrement stock
        if (po.status === 'Arrived') {
            await Product.findByIdAndUpdate(po.product, {
                $inc: { stockInSqFt: -po.quantityInSqFt }
            });
        }

        await po.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Purchase order deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createPurchaseOrder, getPurchaseOrders, getPurchaseOrderById, updatePurchaseOrder, deletePurchaseOrder };
