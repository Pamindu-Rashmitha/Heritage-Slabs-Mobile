import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import orderService from '../api/orderService';
import { THEME } from '../theme';

const getStatusColor = (s) => { if (s === 'Pending') return { text: THEME.warning, bg: THEME.warningBg }; if (s === 'Processing') return { text: THEME.info, bg: THEME.infoBg }; if (s === 'Shipped') return { text: THEME.slate, bg: THEME.slateLight }; if (s === 'Delivered') return { text: THEME.success, bg: THEME.successBg }; return { text: THEME.textSecondary, bg: 'rgba(255,255,255,0.06)' }; };
const getPayColor = (s) => { if (s === 'Paid') return { text: THEME.success, bg: THEME.successBg }; if (s === 'Pending') return { text: THEME.warning, bg: THEME.warningBg }; if (s === 'Failed') return { text: THEME.danger, bg: THEME.dangerBg }; return { text: THEME.textSecondary, bg: 'rgba(255,255,255,0.06)' }; };

const OrderCard = ({ item, onReview, onSupport }) => {
    const sc = getStatusColor(item.status);
    const pc = getPayColor(item.paymentStatus);
    const productNames = item.products?.map(p => p.stoneName || 'Product').join(', ') || 'N/A';
    return (
        <View style={st.card}>
            <View style={st.cardTop}><Text style={st.orderId}>Order #{item._id?.slice(-6).toUpperCase()}</Text><Text style={st.date}>{new Date(item.createdAt).toLocaleDateString()}</Text></View>
            <Text style={st.products} numberOfLines={2}>{productNames}</Text>
            <Text style={st.address} numberOfLines={1}> {item.shippingAddress}</Text>
            <View style={st.badgeRow}>
                <View style={[st.badge, { backgroundColor: sc.bg }]}><Text style={[st.badgeText, { color: sc.text }]}>{item.status}</Text></View>
                <View style={[st.badge, { backgroundColor: pc.bg }]}><Text style={[st.badgeText, { color: pc.text }]}>{item.paymentStatus || 'N/A'}</Text></View>
                {item.paymentMethod && <View style={[st.badge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}><Text style={[st.badgeText, { color: THEME.textSecondary }]}>{item.paymentMethod}{item.cardLastFour ? ` •••• ${item.cardLastFour}` : ''}</Text></View>}
            </View>
            <View style={st.totalRow}><Text style={st.totalLabel}>Total</Text><Text style={st.totalValue}>LKR {item.totalPrice?.toLocaleString()}</Text></View>
            <View style={st.actionRow}>
                <TouchableOpacity style={st.reviewActionBtn} onPress={() => onReview(item)} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="star-outline" size={16} color={THEME.gold} /><Text style={st.reviewActionText}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.supportActionBtn} onPress={() => onSupport(item)} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="headset" size={16} color={THEME.slate} /><Text style={st.supportActionText}>Support</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const MyOrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(useCallback(() => { fetchMyOrders(); }, []));

    const fetchMyOrders = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try { const res = await orderService.getMyOrders(); setOrders(res.data.orders ?? res.data ?? []); }
        catch (e) { Alert.alert('Error', 'Could not load your orders.'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={st.header}>
                <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={THEME.textPrimary} /></TouchableOpacity>
                <View style={st.headerText}><Text style={st.headerEyebrow}>HERITAGE SLABS</Text><Text style={st.headerTitle}>My Orders</Text></View>
            </View>
            {loading ? (
                <View style={st.centered}><ActivityIndicator size="large" color={THEME.gold} /><Text style={st.loadingText}>Loading Orders…</Text></View>
            ) : (
                <FlatList data={orders} keyExtractor={i => i._id} renderItem={({ item }) => (
                    <OrderCard item={item} onReview={(o) => navigation.navigate('SubmitTicket', { type: 'Review', orderId: o._id })} onSupport={(o) => navigation.navigate('SubmitTicket', { type: 'Support', orderId: o._id })} />
                )} contentContainerStyle={[st.listContent, orders.length === 0 && st.listContentEmpty]}
                    ListEmptyComponent={<View style={st.centered}><MaterialCommunityIcons name="clipboard-text-outline" size={72} color={THEME.textMuted} /><Text style={st.emptyTitle}>No Orders Yet</Text><Text style={st.emptySub}>Your orders will appear here after checkout.</Text></View>}
                    refreshing={refreshing} onRefresh={() => fetchMyOrders(true)} showsVerticalScrollIndicator={false}
                    ListHeaderComponent={orders.length > 0 ? <View style={st.statsBar}><Text style={st.statsText}>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</Text></View> : null} />
            )}
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: THEME.border },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 9 }, headerText: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.gold, letterSpacing: 2, marginBottom: 2 }, headerTitle: { fontSize: 22, fontWeight: '800', color: THEME.textPrimary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { marginTop: 12, color: THEME.textSecondary, fontSize: 14 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: THEME.textPrimary, marginTop: 16 }, emptySub: { fontSize: 14, color: THEME.textSecondary, marginTop: 6, textAlign: 'center' },
    statsBar: { paddingHorizontal: 4, paddingVertical: 8 }, statsText: { fontSize: 13, color: THEME.textSecondary, fontWeight: '500' },
    listContent: { padding: 16, paddingBottom: 40 }, listContentEmpty: { flex: 1 },
    card: { backgroundColor: THEME.bgCard, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: THEME.border },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    orderId: { fontSize: 14, fontWeight: '700', color: THEME.textPrimary }, date: { fontSize: 12, color: THEME.textSecondary },
    products: { fontSize: 14, color: THEME.textPrimary, marginBottom: 4, fontWeight: '500' },
    address: { fontSize: 12, color: THEME.textSecondary, marginBottom: 10 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { fontSize: 11, fontWeight: '600' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 10, marginBottom: 10 },
    totalLabel: { fontSize: 14, fontWeight: '500', color: THEME.textSecondary }, totalValue: { fontSize: 18, fontWeight: '800', color: THEME.gold },
    actionRow: { flexDirection: 'row', gap: 10 },
    reviewActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: THEME.gold, borderRadius: 10, paddingVertical: 10, backgroundColor: THEME.goldLight },
    reviewActionText: { color: THEME.gold, fontSize: 13, fontWeight: '700' },
    supportActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: THEME.slate, borderRadius: 10, paddingVertical: 10, backgroundColor: THEME.slateLight },
    supportActionText: { color: THEME.slate, fontSize: 13, fontWeight: '700' },
});

export default MyOrdersScreen;
