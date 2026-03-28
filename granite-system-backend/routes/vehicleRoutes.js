const express = require('express');
const router = express.Router();
const { vehicleValidation, validate } = require('../middleware/validationMiddleware');
const {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getVehicles).post(protect, vehicleValidation, validate, createVehicle);
router.route('/:id').get(protect, getVehicleById).put(protect, vehicleValidation, validate, updateVehicle).delete(protect, deleteVehicle);

module.exports = router;
