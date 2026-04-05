const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Config the storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'heritage-slabs/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        public_id: (req, file) => {
            const fileName = `${req.user && req.user.id ? req.user.id : 'anonymous'}-${Date.now()}`;
            return fileName;
        }
    }
});

// Initialize multer object
const upload = multer({
    storage: storage
});

module.exports = upload;