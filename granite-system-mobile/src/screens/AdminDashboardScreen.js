import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../theme';

const SECTIONS = [
    { key: 'products', title: 'Manage Products', subtitle: 'Add, edit & remove slabs', icon: 'package-variant-closed', color: THEME.indigo, functional: true, route: 'ProductManagement' },
    { key: 'orders', title: 'Manage Orders', subtitle: 'Track customer orders', icon: 'clipboard-list-outline', color: '#60A5FA', functional: true, route: 'OrderManagement' },
    { key: 'deliveries', title: 'Manage Deliveries', subtitle: 'Monitor deliveries & ETAs', icon: 'truck-delivery-outline', color: THEME.warning, functional: true, route: 'DeliveryManagement' },
    { key: 'vehicles', title: 'Manage Vehicles', subtitle: 'Fleet tracking & status', icon: 'car-outline', color: THEME.purple, functional: true, route: 'VehicleManagement' },
    { key: 'suppliers', title: 'Manage Suppliers', subtitle: 'Supplier contacts & info', icon: 'factory', color: '#F97316', functional: true, route: 'SupplierManagement' },
    { key: 'reviews', title: 'Reviews & Tickets', subtitle: 'Customer feedback & support', icon: 'face-agent', color: '#FBBF24', functional: true, route: 'TicketManagement' },
    { key: 'users', title: 'Manage Users', subtitle: 'View, edit & remove users', icon: 'account-group-outline', color: THEME.danger, functional: true, route: 'UserManagement' },
    { key: 'purchaseOrders', title: 'Purchase Orders', subtitle: 'Stock replenishment & suppliers', icon: 'cart-arrow-down', color: '#38BDF8', functional: true, route: 'PurchaseOrderManagement' },
];

const SectionCard = ({ section, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
        <View style={[styles.iconCircle, { backgroundColor: `${section.color}22` }]}>
            <MaterialCommunityIcons name={section.icon} size={28} color={section.color} />
        </View>
        <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardSub}>{section.subtitle}</Text>
        </View>
        {section.functional ? (
            <MaterialCommunityIcons name="chevron-right" size={22} color={THEME.textMuted} />
        ) : (
            <View style={styles.soonBadge}>
                <Text style={styles.soonText}>Soon</Text>
            </View>
        )}
    </TouchableOpacity>
);

const AdminDashboardScreen = ({ navigation }) => {
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            navigation.replace('Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSectionPress = (section) => {
        if (section.functional && section.route) {
            navigation.navigate(section.route);
        } else {
            Alert.alert(section.title, 'This module is coming soon.', [{ text: 'OK' }]);
        }
    };

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
                    <Text style={styles.headerTitle}>Manager Portal</Text>
                </View>
                <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={22} color={THEME.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Section Grid */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {SECTIONS.map((section) => (
                    <SectionCard key={section.key} section={section} onPress={() => handleSectionPress(section)} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    blobTopRight: { position: 'absolute', top: -40, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: THEME.blobIndigo },
    blobBottomLeft: { position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: THEME.blobPurple },

    header: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.indigo, letterSpacing: 2, marginBottom: 4 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: THEME.textPrimary },
    logoutIcon: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, marginTop: 4 },

    scrollContent: { padding: 20, paddingBottom: 40 },

    card: {
        backgroundColor: THEME.bgCard,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    iconCircle: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary, marginBottom: 3 },
    cardSub: { fontSize: 12, color: THEME.textSecondary },

    soonBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    soonText: { fontSize: 11, fontWeight: '700', color: THEME.textMuted },
});

export default AdminDashboardScreen;