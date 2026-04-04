const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Vehicle = require('../models/Vehicle');
const Delivery = require('../models/Delivery');
const Supplier = require('../models/Supplier');
const Ticket = require('../models/Ticket');
const User = require('../models/User');


router.get('/stats', async (req, res) => {
    try {

        const [
            totalOrders, totalProducts, totalUsers,
            totalVehicles, totalSuppliers, totalDeliveries,
            totalTickets, totalPurchaseOrders
        ] = await Promise.all([
            Order.countDocuments(),
            Product.countDocuments(),
            User.countDocuments(),
            Vehicle.countDocuments(),
            Supplier.countDocuments(),
            Delivery.countDocuments(),
            Ticket.countDocuments(),
            PurchaseOrder.countDocuments(),
        ]);


        const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        const processingOrders = await Order.countDocuments({ status: 'Processing' });
        const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
        const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });


        const availableVehicles = await Vehicle.countDocuments({ status: 'Available' });
        const onRouteVehicles = await Vehicle.countDocuments({ status: 'On Route' });
        const maintenanceVehicles = await Vehicle.countDocuments({ status: 'Maintenance' });


        const openTickets = await Ticket.countDocuments({ status: 'Open' });
        const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
        const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });


        const scheduledDeliveries = await Delivery.countDocuments({ status: 'Scheduled' });
        const inTransitDeliveries = await Delivery.countDocuments({ status: 'In Transit' });
        const completedDeliveries = await Delivery.countDocuments({ status: 'Completed' });


        const incomeAgg = await Order.aggregate([
            { $group: { _id: null, totalIncome: { $sum: '$totalPrice' } } }
        ]);
        const totalIncome = incomeAgg.length > 0 ? incomeAgg[0].totalIncome : 0;

        const paidIncomeAgg = await Order.aggregate([
            { $match: { paymentStatus: 'Paid' } },
            { $group: { _id: null, paidIncome: { $sum: '$totalPrice' } } }
        ]);
        const paidIncome = paidIncomeAgg.length > 0 ? paidIncomeAgg[0].paidIncome : 0;


        const pendingIncomeAgg = await Order.aggregate([
            { $match: { paymentStatus: 'Pending' } },
            { $group: { _id: null, pendingIncome: { $sum: '$totalPrice' } } }
        ]);
        const pendingIncome = pendingIncomeAgg.length > 0 ? pendingIncomeAgg[0].pendingIncome : 0;


        const poExpenseAgg = await PurchaseOrder.aggregate([
            { $group: { _id: null, totalExpense: { $sum: '$totalCost' } } }
        ]);
        const totalExpense = poExpenseAgg.length > 0 ? poExpenseAgg[0].totalExpense : 0;

        const poOrdered = await PurchaseOrder.countDocuments({ status: 'Ordered' });
        const poInTransit = await PurchaseOrder.countDocuments({ status: 'In Transit' });
        const poArrived = await PurchaseOrder.countDocuments({ status: 'Arrived' });
        const poCancelled = await PurchaseOrder.countDocuments({ status: 'Cancelled' });


        const recentOrders = await Order.find({})
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('totalPrice status paymentStatus createdAt user');


        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyIncome = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    income: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);


        const monthlyExpenses = await PurchaseOrder.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    expense: { $sum: '$totalCost' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.status(200).json({
            counts: {
                totalOrders, totalProducts, totalUsers,
                totalVehicles, totalSuppliers, totalDeliveries,
                totalTickets, totalPurchaseOrders
            },
            orders: {
                pending: pendingOrders,
                processing: processingOrders,
                shipped: shippedOrders,
                delivered: deliveredOrders
            },
            vehicles: {
                available: availableVehicles,
                onRoute: onRouteVehicles,
                maintenance: maintenanceVehicles
            },
            tickets: {
                open: openTickets,
                inProgress: inProgressTickets,
                resolved: resolvedTickets
            },
            deliveries: {
                scheduled: scheduledDeliveries,
                inTransit: inTransitDeliveries,
                completed: completedDeliveries
            },
            finance: {
                totalIncome,
                paidIncome,
                pendingIncome,
                totalExpense,
                netProfit: totalIncome - totalExpense
            },
            purchaseOrders: {
                ordered: poOrdered,
                inTransit: poInTransit,
                arrived: poArrived,
                cancelled: poCancelled
            },
            recentOrders,
            monthlyIncome,
            monthlyExpenses
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
