const Ticket = require('../models/Ticket');
const Order = require('../models/Order');

const isOnlyNumbers = (str) => /^\d+$/.test(str.trim());

const createTicket = async (req, res) => {
    try {
        const { user, order, subject, description, type } = req.body;

        if (!user || !order || !subject || !description || !type) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const validTypes = ['Review', 'Support'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: 'Type must be either Review or Support' });
        }

        if (isOnlyNumbers(subject)) {
            return res.status(400).json({ message: 'Subject cannot contain only numbers' });
        }

        if (subject.trim().length < 3) {
            return res.status(400).json({ message: 'Subject must be at least 3 characters' });
        }

        if (description.trim().length < 10) {
            return res.status(400).json({ message: 'Description must be at least 10 characters' });
        }

        // Verify the order exists and belongs to the user
        const orderDoc = await Order.findById(order);
        if (!orderDoc) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (orderDoc.user.toString() !== user) {
            return res.status(403).json({ message: 'You can only submit tickets for your own orders' });
        }

        const ticket = await Ticket.create({
            user,
            order,
            subject,
            description,
            type,
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({})
            .populate('user', 'name email')
            .populate('order', 'totalPrice status shippingAddress')
            .sort({ createdAt: -1 });
        res.status(200).json({ tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('user', 'name email')
            .populate('order', 'totalPrice status shippingAddress');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const { status, adminReply } = req.body;
        const validStatuses = ['Open', 'In Progress', 'Resolved'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        if (status) ticket.status = status;
        if (adminReply !== undefined) ticket.adminReply = adminReply;

        const updatedTicket = await ticket.save();

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        await ticket.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Ticket deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.user.id })
            .populate('order', 'totalPrice status shippingAddress')
            .sort({ createdAt: -1 });
        res.status(200).json({ tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createTicket, getTickets, getMyTickets, getTicketById, updateTicket, deleteTicket };
