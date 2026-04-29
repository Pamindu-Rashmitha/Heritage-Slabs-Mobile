const Vehicle = require('../models/Vehicle');

const isOnlyNumbers = (str) => /^\d+$/.test(str.trim());
const LICENSE_PLATE_REGEX = /^[A-Za-z]{2,3}-\d{4}$/;
const MAX_CAPACITY_KG = 3500;

const normalizeLicensePlate = (s) => String(s).trim().toUpperCase();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive match for duplicate checks (stored plates may vary in casing). */
const findOneByPlateInsensitive = (plate) => {
    const norm = normalizeLicensePlate(plate);
    return Vehicle.findOne({
        licensePlate: new RegExp(`^${escapeRegex(norm)}$`, 'i'),
    });
};

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

        if (maxWeightCapacity <= 0 || maxWeightCapacity > MAX_CAPACITY_KG) {
            return res.status(400).json({
                message: `Max weight capacity must be greater than 0 and at most ${MAX_CAPACITY_KG} kg`,
            });
        }

        const plateNormalized = normalizeLicensePlate(licensePlate);
        if (!LICENSE_PLATE_REGEX.test(plateNormalized)) {
            return res.status(400).json({
                message: 'License plate must be 2 or 3 letters, a hyphen (-), then 4 digits',
            });
        }

        const existingVehicle = await findOneByPlateInsensitive(licensePlate);
        if (existingVehicle) {
            return res.status(400).json({ message: 'A vehicle with this license plate already exists' });
        }

        const vehicle = await Vehicle.create({
            licensePlate: plateNormalized,
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

        if (maxWeightCapacity !== undefined && (maxWeightCapacity <= 0 || maxWeightCapacity > MAX_CAPACITY_KG)) {
            return res.status(400).json({
                message: `Max weight capacity must be greater than 0 and at most ${MAX_CAPACITY_KG} kg`,
            });
        }

        let body = { ...req.body };
        if (licensePlate !== undefined) {
            const plateNormalized = normalizeLicensePlate(licensePlate);
            if (!LICENSE_PLATE_REGEX.test(plateNormalized)) {
                return res.status(400).json({
                    message: 'License plate must be 2 or 3 letters, a hyphen (-), then 4 digits',
                });
            }
            if (normalizeLicensePlate(vehicle.licensePlate) !== plateNormalized) {
                const existing = await Vehicle.findOne({
                    licensePlate: new RegExp(`^${escapeRegex(plateNormalized)}$`, 'i'),
                    _id: { $ne: vehicle._id },
                });
                if (existing) {
                    return res.status(400).json({ message: 'A vehicle with this license plate already exists' });
                }
            }
            body.licensePlate = plateNormalized;
        }

        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            body,
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
