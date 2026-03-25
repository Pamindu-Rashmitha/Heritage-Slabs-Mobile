const express = require('express');
const router = express.Router();
const {registerUser, loginUser, updateUser, deleteUser, getUser, getUsers} = require('../controllers/authController');
const {registerValidation, loginValidation, validate} = require('../middleware/validationMiddleware');

router.post('/register',registerValidation,validate, registerUser);
router.post('/login',loginValidation,validate, loginUser);
router.patch('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);
router.get('/users', getUsers);
router.get('/user/:id',getUser);

module.exports = router;