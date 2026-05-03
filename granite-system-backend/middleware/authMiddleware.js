const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {

            // Get the token from the header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token with secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch User from db without password
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({message:'Not authorized, token failed'});
        }
    }

    if (!token) {
        res.status(401).json({message:'Not authorized, no token'});
    }

};

const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({message: 'Not authorized, please login first'});
    }

    if (req.user.role !== 'Admin') {
        return res.status(403).json({message: 'Not authorized, admin access required'});
    }

    next();
};

module.exports = {protect, adminOnly};