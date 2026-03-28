const express = require('express');
const router = express.Router();
const { ticketValidation, validate } = require('../middleware/validationMiddleware');
const {
    createTicket,
    getTickets,
    getMyTickets,
    getTicketById,
    updateTicket,
    deleteTicket
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyTickets);
router.route('/').get(protect, getTickets).post(protect, ticketValidation, validate, createTicket);
router.route('/:id').get(protect, getTicketById).put(protect, updateTicket).delete(protect, deleteTicket);

module.exports = router;
