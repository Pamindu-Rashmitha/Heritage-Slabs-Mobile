const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const notOnlyNumbers = (value) => {
    if (/^\d+$/.test(value.trim())) {
        throw new Error('This field cannot contain only numbers');
    }
    return true;
};

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
        .custom(notOnlyNumbers).withMessage('Name cannot contain only numbers'),
    body('email').notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please include a valid email'),
    body('password')
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }).withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const loginValidation = [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password must be provided')
];

const productValidation = [
    body('stoneName')
        .trim()
        .notEmpty().withMessage('Stone Name is required')
        .isString().withMessage('Stone name must be a text string')
        .isLength({ min: 5 }).withMessage('Stone name must be at least 5 characters')
        .isLength({ max: 20 }).withMessage('Stone name cannot exceed 20 characters')
        .matches(/^[A-Za-z\s\-]+$/).withMessage('Stone name can only contain letters, spaces, and hyphens')
        .custom(notOnlyNumbers).withMessage('Stone name cannot contain only numbers'),
    body('pricePerSqFt')
        .isFloat({ gt: 0 }).withMessage('Price per square foot must be greater than 0')
        .isFloat({ max: 6000 }).withMessage('Price per square foot cannot exceed 6,000'),
    body('stockInSqFt')
        .isFloat({ min: 0 }).withMessage('Stock in square feet must be a non-negative value')
        .isFloat({ max: 1000000 }).withMessage('Stock in square feet cannot exceed 1,000,000')
];

const orderValidation = [
    body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
    body('totalPrice').isFloat({ gt: 0 }).withMessage('Total price must be a positive number'),
    body('shippingAddress').notEmpty().withMessage('Shipping address is required')
        .isLength({ min: 5 }).withMessage('Shipping address must be at least 5 characters')
        .matches(/^\d+,\s*.+,\s*.+$/).withMessage('Address must follow the format: Street Number, Street Name, City'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required')
        .isIn(['Card', 'Cash on Delivery']).withMessage('Payment method must be Card or Cash on Delivery')
];

const deliveryValidation = [
    body('order').notEmpty().withMessage('Order is required'),
    body('vehicle').notEmpty().withMessage('Vehicle is required'),
    body('driverName').notEmpty().withMessage('Driver name is required')
        .isLength({ min: 2 }).withMessage('Driver name must be at least 2 characters')
        .custom(notOnlyNumbers).withMessage('Driver name cannot contain only numbers'),
    body('expectedDeliveryDate').notEmpty().withMessage('Expected delivery date is required')
        .isISO8601().withMessage('Expected delivery date must be a valid date')
];

const LICENSE_PLATE_PATTERN = /^[A-Za-z]{2,3}-\d{4}$/;
const MAX_VEHICLE_CAPACITY_KG = 3500;

const vehicleValidation = [
    body('licensePlate').trim().notEmpty().withMessage('License plate is required')
        .matches(LICENSE_PLATE_PATTERN).withMessage('License plate must be 2 or 3 letters, a hyphen (-), then 4 digits (e.g. AB-1234)'),
    body('vehicleType').notEmpty().withMessage('Vehicle type is required')
        .isString().withMessage('Vehicle type must be a text string')
        .custom(notOnlyNumbers).withMessage('Vehicle type cannot contain only numbers'),
    body('maxWeightCapacity').isFloat({ gt: 0, max: MAX_VEHICLE_CAPACITY_KG }).withMessage(`Max weight capacity must be greater than 0 and at most ${MAX_VEHICLE_CAPACITY_KG} kg`)
];

const supplierValidation = [
    body('companyName').notEmpty().withMessage('Company name is required')
        .isLength({ min: 2 }).withMessage('Company name must be at least 2 characters')
        .custom(notOnlyNumbers).withMessage('Company name cannot contain only numbers'),
    body('contactPerson').notEmpty().withMessage('Contact person is required')
        .isLength({ min: 2 }).withMessage('Contact person must be at least 2 characters')
        .custom(notOnlyNumbers).withMessage('Contact person name cannot contain only numbers'),
    body('email').notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address'),
    body('phone').notEmpty().withMessage('Phone number is required')
        .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits'),
    body('materialsSupplied').notEmpty().withMessage('Materials supplied is required')
        .custom(notOnlyNumbers).withMessage('Materials supplied cannot contain only numbers')
];

const ticketValidation = [
    body('user').notEmpty().withMessage('User is required'),
    body('order').notEmpty().withMessage('Order is required'),
    body('subject').notEmpty().withMessage('Subject is required')
        .isLength({ min: 3 }).withMessage('Subject must be at least 3 characters')
        .custom(notOnlyNumbers).withMessage('Subject cannot contain only numbers'),
    body('description').notEmpty().withMessage('Description is required')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('type').notEmpty().withMessage('Type is required')
        .isIn(['Review', 'Support']).withMessage('Type must be either Review or Support')
];

const purchaseOrderValidation = [
    body('supplier').notEmpty().withMessage('Supplier is required'),
    body('product').notEmpty().withMessage('Product is required'),
    body('quantityInSqFt').isFloat({ gt: 0 }).withMessage('Quantity must be a positive number'),
    body('unitCost').isFloat({ gt: 0 }).withMessage('Unit cost must be a positive number')
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    productValidation,
    orderValidation,
    deliveryValidation,
    vehicleValidation,
    supplierValidation,
    ticketValidation,
    purchaseOrderValidation
};