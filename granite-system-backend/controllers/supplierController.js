const Supplier = require('../models/Supplier');

const isOnlyNumbers = (str) => /^\d+$/.test(str.trim());

const createSupplier = async (req, res) => {
    try {
        const { companyName, contactPerson, email, phone, materialsSupplied } = req.body;

        if (!companyName || !contactPerson || !email || !phone || !materialsSupplied) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        // No-only-numbers checks
        if (isOnlyNumbers(companyName)) {
            return res.status(400).json({ message: 'Company name cannot contain only numbers' });
        }
        if (isOnlyNumbers(contactPerson)) {
            return res.status(400).json({ message: 'Contact person name cannot contain only numbers' });
        }
        if (isOnlyNumbers(materialsSupplied)) {
            return res.status(400).json({ message: 'Materials supplied cannot contain only numbers' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Phone validation — exactly 10 digits
        if (!/^\d{10}$/.test(phone.trim())) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
        }

        if (companyName.trim().length < 2) {
            return res.status(400).json({ message: 'Company name must be at least 2 characters' });
        }

        if (contactPerson.trim().length < 2) {
            return res.status(400).json({ message: 'Contact person must be at least 2 characters' });
        }

        const supplier = await Supplier.create({
            companyName,
            contactPerson,
            email,
            phone,
            materialsSupplied,
        });

        res.status(201).json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
        res.status(200).json({ suppliers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.status(200).json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const { email, phone, companyName, contactPerson, materialsSupplied } = req.body;

        // No-only-numbers checks
        if (companyName !== undefined && isOnlyNumbers(companyName)) {
            return res.status(400).json({ message: 'Company name cannot contain only numbers' });
        }
        if (contactPerson !== undefined && isOnlyNumbers(contactPerson)) {
            return res.status(400).json({ message: 'Contact person name cannot contain only numbers' });
        }
        if (materialsSupplied !== undefined && isOnlyNumbers(materialsSupplied)) {
            return res.status(400).json({ message: 'Materials supplied cannot contain only numbers' });
        }

        // Validate email if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Please provide a valid email address' });
            }
        }

        if (phone) {
            if (!/^\d{10}$/.test(phone.trim())) {
                return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
            }
        }

        if (companyName !== undefined && companyName.trim().length < 2) {
            return res.status(400).json({ message: 'Company name must be at least 2 characters' });
        }

        if (contactPerson !== undefined && contactPerson.trim().length < 2) {
            return res.status(400).json({ message: 'Contact person must be at least 2 characters' });
        }

        const updatedSupplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedSupplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        await supplier.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Supplier deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier };
