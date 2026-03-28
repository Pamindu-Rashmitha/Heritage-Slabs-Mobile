const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const Vehicle = require('../models/Vehicle');

const createDelivery = async (req, res) => {
    try {
        const { order, vehicle, driverName, expectedDeliveryDate } = req.body;

        if (!order || !vehicle || !driverName || !expectedDeliveryDate) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        if (driverName.trim().length < 2) {
            return res.status(400).json({ message: 'Driver name must be at least 2 characters' });
        }

        // Verify order and vehicle exist
        const orderDoc = await Order.findById(order);
        if (!orderDoc) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const vehicleDoc = await Vehicle.findById(vehicle);
        if (!vehicleDoc) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicleDoc.status === 'On Route') {
            return res.status(400).json({ message: 'This vehicle is already on route. Please select an available vehicle.' });
        }

        if (vehicleDoc.status === 'Maintenance') {
            return res.status(400).json({ message: 'This vehicle is under maintenance. Please select an available vehicle.' });
        }

        const delivery = await Delivery.create({
            order,
            vehicle,
            driverName,
            expectedDeliveryDate,
        });

        orderDoc.status = 'Processing';
        await orderDoc.save();

        vehicleDoc.status = 'On Route';
        await vehicleDoc.save();

        res.status(201).json(delivery);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find({})
            .populate({
                path: 'order',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('vehicle', 'licensePlate vehicleType status')
            .sort({ createdAt: -1 });
        res.status(200).json({ deliveries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate({
                path: 'order',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('vehicle', 'licensePlate vehicleType status');

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        res.status(200).json(delivery);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        const { status, driverName, expectedDeliveryDate, vehicle } = req.body;
        const validStatuses = ['Scheduled', 'In Transit', 'Completed'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        if (driverName !== undefined && driverName.trim().length < 2) {
            return res.status(400).json({ message: 'Driver name must be at least 2 characters' });
        }

        const oldStatus = delivery.status;

        delivery.status = status || delivery.status;
        delivery.driverName = driverName || delivery.driverName;
        delivery.expectedDeliveryDate = expectedDeliveryDate || delivery.expectedDeliveryDate;
        delivery.vehicle = vehicle || delivery.vehicle;

        const updatedDelivery = await delivery.save();

        if (status && status !== oldStatus) {
            if (status === 'Completed') {
                await Order.findByIdAndUpdate(delivery.order, { status: 'Delivered' });
                await Vehicle.findByIdAndUpdate(delivery.vehicle, { status: 'Available' });
            } else if (status === 'In Transit') {
                await Order.findByIdAndUpdate(delivery.order, { status: 'Shipped' });
            }
        }

        res.status(200).json(updatedDelivery);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        await Order.findByIdAndUpdate(delivery.order, { status: 'Pending' });
        await Vehicle.findByIdAndUpdate(delivery.vehicle, { status: 'Available' });

        await delivery.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Delivery deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createDelivery, getDeliveries, getDeliveryById, updateDelivery, deleteDelivery };
