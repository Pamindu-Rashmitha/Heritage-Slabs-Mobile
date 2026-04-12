import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import orderService from '../api/orderService';
import { THEME } from '../theme';

const STATUS_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const getStatusColor = (status) => { switch (status) { case 'Pending': return { text: THEME.warning, bg: THEME.warningBg }; case 'Processing': return { text: THEME.info, bg: THEME.infoBg }; case 'Shipped': return { text: THEME.slate, bg: THEME.slateLight }; case 'Delivered': return { text: THEME.success, bg: THEME.successBg }; default: return { text: THEME.textSecondary, bg: 'rgba(255,255,255,0.06)' }; } };

const StatsBar = ({ count }) => (<View style={styles.statsBar}><Text style={styles.statsText}>{count} {count === 1 ? 'Order' : 'Orders'}</Text></View>);

const OrderRow = ({ item, onUpdateStatus, onDelete }) => {
    const statusColor = getStatusColor(item.status);
    const userName = item.user?.name || 'Unknown User';
    const productCount = item.products?.length || 0;
    const payColor = item.paymentStatus === 'Paid' ? { text: THEME.success, bg: THEME.successBg } : item.paymentStatus === 'Failed' ? { text: THEME.danger, bg: THEME.dangerBg } : { text: THEME.warning, bg: THEME.warningBg };
    return (
        <View style={styles.row}><View style={styles.rowBody}><View style={styles.rowInfo}>
            <Text style={styles.rowName} numberOfLines={1}>{userName}</Text>
            <View style={styles.rowMeta}><View style={[styles.badge, { backgroundColor: statusColor.bg }]}><Text style={[styles.badgeText, { color: statusColor.text }]}>{item.status}</Text></View><Text style={styles.metaText}>{productCount} item(s)</Text></View>
            <View style={[styles.rowMeta, { marginBottom: 4 }]}>
                {item.paymentMethod && <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}><Text style={[styles.badgeText, { color: THEME.textSecondary }]}>{item.paymentMethod}{item.cardLastFour ? ` •••• ${item.cardLastFour}` : ''}</Text></View>}
                {item.paymentStatus && <View style={[styles.badge, { backgroundColor: payColor.bg }]}><Text style={[styles.badgeText, { color: payColor.text }]}>{item.paymentStatus}</Text></View>}
            </View>
            <Text style={styles.priceText}>LKR {item.totalPrice?.toLocaleString()}</Text>
            <Text style={styles.addressText} numberOfLines={1}>{item.shippingAddress}</Text>
        </View>
        <View style={styles.rowActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.updateBtn]} onPress={() => onUpdateStatus(item)} activeOpacity={0.8}><MaterialCommunityIcons name="swap-horizontal" size={18} color={THEME.gold} /><Text style={[styles.actionText, { color: THEME.gold }]}>Status</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(item)} activeOpacity={0.8}><MaterialCommunityIcons name="trash-can-outline" size={18} color={THEME.danger} /><Text style={[styles.actionText, { color: THEME.danger }]}>Delete</Text></TouchableOpacity>
        </View></View></View>
    );
};

const EmptyState = () => (<View style={styles.emptyContainer}><MaterialCommunityIcons name="clipboard-list-outline" size={72} color={THEME.textMuted} /><Text style={styles.emptyTitle}>No Orders Yet</Text><Text style={styles.emptySub}>Orders will appear here once placed.</Text></View>);

const OrderManagementScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false); const [selectedOrder, setSelectedOrder] = useState(null);
    useFocusEffect(useCallback(() => { fetchOrders(); }, []));
    const fetchOrders = async (isRefresh = false) => { if (isRefresh) setRefreshing(true); else setLoading(true); try { const response = await orderService.getAll(); const data = response.data.orders ?? response.data; setOrders(Array.isArray(data) ? data : []); } catch (error) { Alert.alert('Fetch Error', 'Could not load orders.'); } finally { setLoading(false); setRefreshing(false); } };
    const handleUpdateStatus = (item) => { setSelectedOrder(item); setStatusModalVisible(true); };
    const confirmStatusUpdate = async (newStatus) => { setStatusModalVisible(false); try { await orderService.updateStatus(selectedOrder._id, newStatus); setOrders((prev) => prev.map((o) => o._id === selectedOrder._id ? { ...o, status: newStatus } : o)); } catch (error) { Alert.alert('Update Failed', 'Could not update order status.'); } };
    const handleDelete = (item) => { Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await orderService.delete(item._id); setOrders((prev) => prev.filter((o) => o._id !== item._id)); } catch (error) { Alert.alert('Delete Failed', 'Could not delete the order.'); } } }]); };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.header}><TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={THEME.textPrimary} /></TouchableOpacity><View style={styles.headerText}><Text style={styles.headerEyebrow}>ADMIN</Text><Text style={styles.headerTitle}>Manage Orders</Text></View></View>
            {loading ? (<View style={styles.centered}><ActivityIndicator size="large" color={THEME.gold} /><Text style={styles.loadingText}>Loading Orders…</Text></View>) : (<><StatsBar count={orders.length} /><FlatList data={orders} keyExtractor={(item) => item._id} renderItem={({ item }) => (<OrderRow item={item} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />)} contentContainerStyle={[styles.listContent, orders.length === 0 && styles.listContentEmpty]} ListEmptyComponent={<EmptyState />} refreshing={refreshing} onRefresh={() => fetchOrders(true)} showsVerticalScrollIndicator={false} /></>)}
            <Modal visible={statusModalVisible} transparent animationType="fade"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Update Order Status</Text>{STATUS_FLOW.map((status) => (<TouchableOpacity key={status} style={[styles.modalOption, selectedOrder?.status === status && styles.modalOptionActive]} onPress={() => confirmStatusUpdate(status)}><Text style={[styles.modalOptionText, selectedOrder?.status === status && styles.modalOptionTextActive]}>{status}</Text></TouchableOpacity>))}<TouchableOpacity style={styles.modalCancel} onPress={() => setStatusModalVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity></View></View></Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: THEME.border },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 9 }, headerText: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.gold, letterSpacing: 2, marginBottom: 2 }, headerTitle: { fontSize: 22, fontWeight: '800', color: THEME.textPrimary },
    statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }, statsText: { fontSize: 13, color: THEME.textSecondary, fontWeight: '500' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { marginTop: 12, color: THEME.textSecondary, fontSize: 14 },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 }, listContentEmpty: { flex: 1 },
    row: { backgroundColor: THEME.bgCard, borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border },
    rowBody: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 10 }, rowInfo: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary, marginBottom: 6 }, rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { fontSize: 12, fontWeight: '600' }, metaText: { fontSize: 12, color: THEME.textSecondary },
    priceText: { fontSize: 13, fontWeight: '600', color: THEME.textPrimary, marginBottom: 2 }, addressText: { fontSize: 12, color: THEME.textSecondary },
    rowActions: { flexDirection: 'column', gap: 6 }, actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 70, justifyContent: 'center' },
    updateBtn: { backgroundColor: THEME.goldLight }, deleteBtn: { backgroundColor: THEME.dangerBg }, actionText: { fontSize: 12, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }, emptyTitle: { fontSize: 20, fontWeight: '700', color: THEME.textPrimary, marginTop: 16 }, emptySub: { fontSize: 14, color: THEME.textSecondary, marginTop: 6, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' }, modalContent: { backgroundColor: 'rgba(20,20,40,0.95)', borderRadius: 20, padding: 24, width: '80%', borderWidth: 1, borderColor: THEME.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textPrimary, marginBottom: 16, textAlign: 'center' },
    modalOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.06)' }, modalOptionActive: { backgroundColor: THEME.goldLight, borderWidth: 1, borderColor: THEME.gold },
    modalOptionText: { fontSize: 15, fontWeight: '500', color: THEME.textPrimary, textAlign: 'center' }, modalOptionTextActive: { color: THEME.gold, fontWeight: '700' },
    modalCancel: { paddingVertical: 12, marginTop: 4 }, modalCancelText: { fontSize: 15, fontWeight: '600', color: THEME.textSecondary, textAlign: 'center' },
});

export default OrderManagementScreen;
