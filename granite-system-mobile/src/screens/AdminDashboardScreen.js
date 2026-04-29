import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../api/dashboardService';
import { THEME, glassCard } from '../theme';

const MANAGEMENT_SECTIONS = [
    { key: 'products', title: 'Products', icon: 'package-variant-closed', color: THEME.gold, route: 'ProductManagement' },
    { key: 'orders', title: 'Orders', icon: 'clipboard-list-outline', color: '#60A5FA', route: 'OrderManagement' },
    { key: 'deliveries', title: 'Deliveries', icon: 'truck-delivery-outline', color: THEME.warning, route: 'DeliveryManagement' },
    { key: 'vehicles', title: 'Vehicles', icon: 'car-outline', color: THEME.slate, route: 'VehicleManagement' },
    { key: 'suppliers', title: 'Suppliers', icon: 'factory', color: '#F97316', route: 'SupplierManagement' },
    { key: 'tickets', title: 'Support', icon: 'face-agent', color: '#FBBF24', route: 'TicketManagement' },
    { key: 'users', title: 'Users', icon: 'account-group-outline', color: THEME.danger, route: 'UserManagement' },
    { key: 'purchaseOrders', title: 'PO', icon: 'cart-arrow-down', color: '#38BDF8', route: 'PurchaseOrderManagement' },
];

const QUICK_ACTIONS = [
    { label: 'Add Product', icon: 'plus-box', route: 'AddProduct' },
    { label: 'Schedule Delivery', icon: 'truck-plus', route: 'DeliveryManagement' },
    { label: 'New PO', icon: 'cart-plus', route: 'PurchaseOrderManagement' },
];

const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.card, styles.statCard]}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
    </View>
);

const FinanceSection = ({ finance }) => {
    if (!finance) return null;
    const profit = finance.totalIncome - finance.totalExpense;
    const isProfit = profit >= 0;

    return (
        <View style={[styles.card, styles.financeCard]}>
            <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="wallet-outline" size={20} color={THEME.gold} />
                <Text style={styles.sectionTitle}>Financial Summary</Text>
            </View>

            <View style={styles.financeMain}>
                <View>
                    <Text style={styles.financeLabel}>Estimated Net</Text>
                    <Text style={[styles.financeValue, { color: isProfit ? THEME.success : THEME.danger }]}>
                        {isProfit ? '+' : ''}LKR {Math.abs(profit).toLocaleString()}
                    </Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: isProfit ? THEME.successBg : THEME.dangerBg }]}>
                    <MaterialCommunityIcons name={isProfit ? "trending-up" : "trending-down"} size={14} color={isProfit ? THEME.success : THEME.danger} />
                    <Text style={[styles.trendText, { color: isProfit ? THEME.success : THEME.danger }]}>
                        {isProfit ? 'PROFIT' : 'LOSS'}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.financeGrid}>
                <View style={styles.financeItem}>
                    <Text style={styles.metaLabel}>Total Income</Text>
                    <Text style={styles.metaValue}>LKR {finance.totalIncome?.toLocaleString()}</Text>
                </View>
                <View style={styles.financeItem}>
                    <Text style={styles.metaLabel}>Expenses (PO)</Text>
                    <Text style={[styles.metaValue, { color: THEME.danger }]}>LKR {finance.totalExpense?.toLocaleString()}</Text>
                </View>
            </View>
        </View>
    );
};

const AdminDashboardScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const res = await dashboardService.getStats();
            setStats(res.data);
        } catch (error) {
            console.error('Stats fetch error:', error);
            // Don't alert on background refresh
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={THEME.gold} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

            {/* Decorative blobs */}
            <View style={styles.blobTopRight} />
            <View style={styles.blobBottomLeft} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerEyebrow}>HERITAGE SLABS</Text>
                    <Text style={styles.headerTitle}>Dashboard</Text>
                </View>
                <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={22} color={THEME.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor={THEME.gold} />}
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard title="Orders" value={stats?.counts?.totalOrders || 0} icon="clipboard-list-outline" color="#3B82F6" />
                    <StatCard title="Active Del." value={stats?.deliveries?.inTransit || 0} icon="truck-delivery-outline" color={THEME.warning} />
                    <StatCard title="Vehicles" value={stats?.counts?.totalVehicles || 0} icon="car-outline" color={THEME.slate} />
                    <StatCard title="Help Desk" value={stats?.tickets?.open || 0} icon="face-agent" color={THEME.danger} />
                </View>

                {/* Finance Tracker */}
                <FinanceSection finance={stats?.finance} />

                {/* Quick Actions */}
                <Text style={styles.sectionHeading}>Quick Actions</Text>
                <View style={styles.quickActionsRow}>
                    {QUICK_ACTIONS.map((action, index) => (
                        <TouchableOpacity key={index} style={[styles.card, styles.quickActionCard]} onPress={() => navigation.navigate(action.route)}>
                            <MaterialCommunityIcons name={action.icon} size={28} color={THEME.gold} />
                            <Text style={styles.quickActionLabel}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Management Links */}
                <Text style={styles.sectionHeading}>Management Center</Text>
                <View style={styles.managementGrid}>
                    {MANAGEMENT_SECTIONS.map((section) => (
                        <TouchableOpacity key={section.key} style={[styles.card, styles.managementCard]} onPress={() => navigation.navigate(section.route)}>
                            <View style={[styles.managementIcon, { backgroundColor: `${section.color}18` }]}>
                                <MaterialCommunityIcons name={section.icon} size={22} color={section.color} />
                            </View>
                            <Text style={styles.managementText}>{section.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    blobTopRight: { position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: THEME.blobGold },
    blobBottomLeft: { position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: THEME.blobSlate },

    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.gold, letterSpacing: 2, marginBottom: 2 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: THEME.textPrimary },
    logoutIcon: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 },

    scrollContent: { padding: 20, paddingBottom: 40 },

    card: { ...glassCard, padding: 16, marginBottom: 12 },

    // Stats Grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
    statCard: { flex: 1, minWidth: '45%', alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: THEME.textPrimary, marginTop: 8 },
    statLabel: { fontSize: 12, color: THEME.textSecondary, marginTop: 2 },
    iconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    // Finance Section
    financeCard: { padding: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: THEME.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
    financeMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
    financeLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 4 },
    financeValue: { fontSize: 24, fontWeight: '800' },
    trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    trendText: { fontSize: 10, fontWeight: '900' },
    divider: { height: 1, backgroundColor: THEME.divider, marginBottom: 16 },
    financeGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    financeItem: { flex: 1 },
    metaLabel: { fontSize: 11, color: THEME.textMuted, marginBottom: 2 },
    metaValue: { fontSize: 14, fontWeight: '700', color: THEME.textPrimary },

    sectionHeading: { fontSize: 18, fontWeight: '800', color: THEME.textPrimary, marginTop: 12, marginBottom: 16, marginLeft: 4 },

    // Quick Actions
    quickActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    quickActionCard: { flex: 1, alignItems: 'center', paddingVertical: 20 },
    quickActionLabel: { fontSize: 11, fontWeight: '700', color: THEME.textPrimary, marginTop: 10, textAlign: 'center' },

    // Management Center
    managementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    managementCard: { width: '22%', minHeight: 90, alignItems: 'center', justifyContent: 'center', padding: 8, marginBottom: 0 },
    managementIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    managementText: { fontSize: 10, fontWeight: '600', color: THEME.textSecondary, textAlign: 'center' },
});

export default AdminDashboardScreen;