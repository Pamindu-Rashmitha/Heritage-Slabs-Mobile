const Vehicle = require('../models/Vehicle');

const isOnlyNumbers = (str) => /^\d+$/.test(str.trim());

const createVehicle = async (req, res) => {
    try {
        const { licensePlate, vehicleType, maxWeightCapacity } = req.body;

        if (!licensePlate || !vehicleType || !maxWeightCapacity) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        if (isOnlyNumbers(vehicleType)) {
            return res.status(400).json({ message: 'Vehicle type cannot contain only numbers' });
        }

        if (vehicleType.trim().length < 2) {
            return res.status(400).json({ message: 'Vehicle type must be at least 2 characters' });
        }

        if (maxWeightCapacity <= 0) {
            return res.status(400).json({ message: 'Max weight capacity must be greater than 0' });
        }

        // Check for duplicate license plate
        const existingVehicle = await Vehicle.findOne({ licensePlate });
        if (existingVehicle) {
            return res.status(400).json({ message: 'A vehicle with this license plate already exists' });
        }

        const vehicle = await Vehicle.create({
            licensePlate,
            vehicleType,
            maxWeightCapacity,
        });

        res.status(201).json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({}).sort({ createdAt: -1 });
        res.status(200).json({ vehicles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const { licensePlate, vehicleType, maxWeightCapacity, status } = req.body;
        const validStatuses = ['Available', 'On Route', 'Maintenance'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        if (vehicleType !== undefined && isOnlyNumbers(vehicleType)) {
            return res.status(400).json({ message: 'Vehicle type cannot contain only numbers' });
        }

        if (vehicleType !== undefined && vehicleType.trim().length < 2) {
            return res.status(400).json({ message: 'Vehicle type must be at least 2 characters' });
        }

        if (maxWeightCapacity !== undefined && maxWeightCapacity <= 0) {
            return res.status(400).json({ message: 'Max weight capacity must be greater than 0' });
        }

        // Check duplicate license plate on update 
        if (licensePlate && licensePlate !== vehicle.licensePlate) {
            const existing = await Vehicle.findOne({ licensePlate });
            if (existing) {
                return res.status(400).json({ message: 'A vehicle with this license plate already exists' });
            }
        }

        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedVehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        await vehicle.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Vehicle deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle };
