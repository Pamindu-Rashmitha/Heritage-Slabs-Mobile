import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';

const COLORS = { dark: '#1e2235', accent: '#0077b6', accentLight: '#e3f2fd', danger: '#e63946', dangerLight: '#fdecea', bg: '#f0f2f5', white: '#ffffff', textPrimary: '#1e2235', textSub: '#6b7280', border: '#e5e7eb', teal: '#2a9d8f', tealLight: '#e8f5f4' };
const STATUS_FLOW = ['Ordered', 'In Transit', 'Arrived', 'Cancelled'];
const getStatusColor = (s) => {
    if (s === 'Ordered') return { text: '#4361ee', bg: '#eaedfc' };
    if (s === 'In Transit') return { text: '#f4a261', bg: '#fdf3ea' };
    if (s === 'Arrived') return { text: '#2a9d8f', bg: '#e8f5f4' };
    if (s === 'Cancelled') return { text: '#e63946', bg: '#fdecea' };
    return { text: COLORS.textSub, bg: COLORS.bg };
};

const PORow = ({ item, onUpdateStatus, onDelete }) => {
    const sc = getStatusColor(item.status);
    return (
        <View style={s.row}><View style={s.rowBody}><View style={s.rowInfo}>
            <Text style={s.rowName} numberOfLines={1}>{item.product?.stoneName || 'Product'}</Text>
            <View style={s.rowMeta}>
                <View style={[s.badge, { backgroundColor: sc.bg }]}><Text style={[s.badgeText, { color: sc.text }]}>{item.status}</Text></View>
                <Text style={s.metaText}>{item.quantityInSqFt} SqFt</Text>
            </View>
            <Text style={s.subText}>Supplier: {item.supplier?.companyName || 'Unknown'}</Text>
            <Text style={s.subText}>Total: LKR {item.totalCost?.toLocaleString()}</Text>
            {item.expectedArrivalDate && <Text style={s.subText}>ETA: {new Date(item.expectedArrivalDate).toLocaleDateString()}</Text>}
        </View>
        <View style={s.rowActions}>
            <TouchableOpacity style={[s.actionBtn, s.updateBtn]} onPress={() => onUpdateStatus(item)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="swap-horizontal" size={18} color={COLORS.accent} /><Text style={[s.actionText, { color: COLORS.accent }]}>Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => onDelete(item)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} /><Text style={[s.actionText, { color: COLORS.danger }]}>Delete</Text>
            </TouchableOpacity>
        </View></View></View>
    );
};

const PurchaseOrderManagementScreen = ({ navigation }) => {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [formModalVisible, setFormModalVisible] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [supplierPickerVisible, setSupplierPickerVisible] = useState(false);
    const [productPickerVisible, setProductPickerVisible] = useState(false);

    useFocusEffect(useCallback(() => { fetchAllData(); }, []));

    const fetchAllData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const h = { Authorization: `Bearer ${token}` };
            const [poR, sR, pR] = await Promise.all([
                api.get('/purchase-orders', { headers: h }),
                api.get('/suppliers', { headers: h }),
                api.get('/products', { headers: h })
            ]);
            setPurchaseOrders(poR.data.purchaseOrders ?? poR.data ?? []);
            setSuppliers(sR.data.suppliers ?? sR.data ?? []);
            setProducts(pR.data.products ?? pR.data ?? []);
        } catch (e) { Alert.alert('Fetch Error', 'Could not load data.'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const openAddForm = () => {
        setSelectedSupplierId(''); setSelectedProductId(''); setQuantity(''); setUnitCost(''); setExpectedDate('');
        setFormModalVisible(true);
    };

    const validateForm = () => {
        if (!selectedSupplierId) { Alert.alert('Validation Error', 'Please select a supplier.'); return false; }
        if (!selectedProductId) { Alert.alert('Validation Error', 'Please select a product.'); return false; }
        if (!quantity.trim() || parseFloat(quantity) <= 0) { Alert.alert('Validation Error', 'Quantity must be a positive number.'); return false; }
        if (!unitCost.trim() || parseFloat(unitCost) <= 0) { Alert.alert('Validation Error', 'Unit cost must be a positive number.'); return false; }
        if (expectedDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(expectedDate.trim())) { Alert.alert('Validation Error', 'Date must be in YYYY-MM-DD format.'); return false; }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setFormLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const payload = {
                supplier: selectedSupplierId,
                product: selectedProductId,
                quantityInSqFt: parseFloat(quantity),
                unitCost: parseFloat(unitCost),
            };
            if (expectedDate.trim()) payload.expectedArrivalDate = expectedDate.trim();
            await api.post('/purchase-orders', payload, { headers: { Authorization: `Bearer ${token}` } });
            Alert.alert('Success', 'Purchase order created.');
            setFormModalVisible(false); fetchAllData();
        } catch (e) { Alert.alert('Error', e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Could not create purchase order.'); }
        finally { setFormLoading(false); }
    };

    const confirmStatusUpdate = async (newStatus) => {
        setStatusModalVisible(false);
        try {
            const token = await AsyncStorage.getItem('userToken');
            await api.put(`/purchase-orders/${selectedPO._id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            if (newStatus === 'Arrived' && selectedPO.status !== 'Arrived') {
                Alert.alert('Stock Updated', `${selectedPO.product?.stoneName || 'Product'} stock increased by ${selectedPO.quantityInSqFt} SqFt.`);
            }
            fetchAllData();
        } catch (e) { Alert.alert('Update Failed', 'Could not update status.'); }
    };

    const handleDelete = (item) => {
        const stockWarning = item.status === 'Arrived' ? '\n\nThis will also decrement the product stock.' : '';
        Alert.alert('Delete Purchase Order', `Delete this purchase order?${stockWarning}`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                await api.delete(`/purchase-orders/${item._id}`, { headers: { Authorization: `Bearer ${token}` } });
                setPurchaseOrders(p => p.filter(po => po._id !== item._id));
            } catch (e) { Alert.alert('Delete Failed', 'Could not delete this purchase order.'); }
        }}]);
    };

    const getSupplierLabel = () => { const su = suppliers.find(x => x._id === selectedSupplierId); return su ? su.companyName : 'Tap to select supplier'; };
    const getProductLabel = () => { const pr = products.find(x => x._id === selectedProductId); return pr ? `${pr.stoneName} (${pr.stockInSqFt} SqFt)` : 'Tap to select product'; };
    const computedTotal = (quantity && unitCost) ? (parseFloat(quantity) * parseFloat(unitCost)).toLocaleString() : '0';

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} /></TouchableOpacity>
                <View style={s.headerText}><Text style={s.headerEyebrow}>ADMIN</Text><Text style={s.headerTitle}>Purchase Orders</Text></View>
            </View>
            {loading ? (
                <View style={s.centered}><ActivityIndicator size="large" color={COLORS.accent} /><Text style={s.loadingText}>Loading POs…</Text></View>
            ) : (
                <>
                    <View style={s.statsBar}><Text style={s.statsText}>{purchaseOrders.length} {purchaseOrders.length === 1 ? 'Purchase Order' : 'Purchase Orders'}</Text></View>
                    <FlatList data={purchaseOrders} keyExtractor={i => i._id} renderItem={({ item }) => (
                        <PORow item={item} onUpdateStatus={i => { setSelectedPO(i); setStatusModalVisible(true); }} onDelete={handleDelete} />
                    )} contentContainerStyle={[s.listContent, purchaseOrders.length === 0 && s.listContentEmpty]}
                        ListEmptyComponent={<View style={s.emptyContainer}><MaterialCommunityIcons name="cart-arrow-down" size={72} color={COLORS.border} /><Text style={s.emptyTitle}>No Purchase Orders</Text><Text style={s.emptySub}>Tap + to create a purchase order.</Text></View>}
                        refreshing={refreshing} onRefresh={() => fetchAllData(true)} showsVerticalScrollIndicator={false} />
                </>
            )}
            <TouchableOpacity style={s.fab} onPress={openAddForm} activeOpacity={0.85}><MaterialCommunityIcons name="plus" size={30} color={COLORS.white} /></TouchableOpacity>

            {/* Status Modal */}
            <Modal visible={statusModalVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={s.modalContent}>
                <Text style={s.modalTitle}>Update PO Status</Text>
                {STATUS_FLOW.map(st => (
                    <TouchableOpacity key={st} style={[s.modalOption, selectedPO?.status === st && s.modalOptionActive]} onPress={() => confirmStatusUpdate(st)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <Text style={[s.modalOptionText, selectedPO?.status === st && s.modalOptionTextActive]}>{st}</Text>
                            {st === 'Arrived' && <MaterialCommunityIcons name="package-variant" size={16} color={selectedPO?.status === st ? COLORS.teal : COLORS.textSub} />}
                        </View>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={s.modalCancel} onPress={() => setStatusModalVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>

            {/* Add Form Modal */}
            <Modal visible={formModalVisible} transparent animationType="slide"><View style={s.modalOverlay}><View style={[s.modalContent, { width: '90%' }]}>
                <Text style={s.modalTitle}>New Purchase Order</Text><ScrollView>
                <Text style={s.label}>Supplier</Text>
                <TouchableOpacity style={s.input} onPress={() => setSupplierPickerVisible(true)}>
                    <Text style={{ color: selectedSupplierId ? COLORS.textPrimary : '#999', fontSize: 15 }}>{getSupplierLabel()}</Text>
                </TouchableOpacity>
                <Text style={s.label}>Product</Text>
                <TouchableOpacity style={s.input} onPress={() => setProductPickerVisible(true)}>
                    <Text style={{ color: selectedProductId ? COLORS.textPrimary : '#999', fontSize: 15 }}>{getProductLabel()}</Text>
                </TouchableOpacity>
                <Text style={s.label}>Quantity (SqFt)</Text>
                <TextInput style={s.input} placeholder="e.g. 500" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                <Text style={s.label}>Unit Cost (LKR per SqFt)</Text>
                <TextInput style={s.input} placeholder="e.g. 150" value={unitCost} onChangeText={setUnitCost} keyboardType="numeric" />
                {quantity && unitCost ? <Text style={s.totalPreview}>Total Cost: LKR {computedTotal}</Text> : null}
                <Text style={s.label}>Expected Arrival Date (YYYY-MM-DD)</Text>
                <TextInput style={s.input} placeholder="e.g. 2026-04-15" value={expectedDate} onChangeText={setExpectedDate} />
                <TouchableOpacity style={[s.submitBtn, formLoading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={formLoading}>
                    {formLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Create Purchase Order</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.modalCancel} onPress={() => setFormModalVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
                </ScrollView>
            </View></View></Modal>

            {/* Supplier Picker */}
            <Modal visible={supplierPickerVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={[s.modalContent, { width: '90%', maxHeight: '60%' }]}>
                <Text style={s.modalTitle}>Select Supplier</Text>
                <FlatList data={suppliers} keyExtractor={i => i._id} renderItem={({ item }) => (
                    <TouchableOpacity style={[s.modalOption, selectedSupplierId === item._id && s.modalOptionActive]} onPress={() => { setSelectedSupplierId(item._id); setSupplierPickerVisible(false); }}>
                        <Text style={[s.modalOptionText, selectedSupplierId === item._id && s.modalOptionTextActive]}>{item.companyName}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textSub, textAlign: 'center' }}>{item.materialsSupplied}</Text>
                    </TouchableOpacity>
                )} ListEmptyComponent={<Text style={{ textAlign: 'center', color: COLORS.textSub, padding: 20 }}>No suppliers available</Text>} />
                <TouchableOpacity style={s.modalCancel} onPress={() => setSupplierPickerVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>

            {/* Product Picker */}
            <Modal visible={productPickerVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={[s.modalContent, { width: '90%', maxHeight: '60%' }]}>
                <Text style={s.modalTitle}>Select Product</Text>
                <FlatList data={products} keyExtractor={i => i._id} renderItem={({ item }) => (
                    <TouchableOpacity style={[s.modalOption, selectedProductId === item._id && s.modalOptionActive]} onPress={() => { setSelectedProductId(item._id); setProductPickerVisible(false); }}>
                        <Text style={[s.modalOptionText, selectedProductId === item._id && s.modalOptionTextActive]}>{item.stoneName}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textSub, textAlign: 'center' }}>Stock: {item.stockInSqFt} SqFt | LKR {item.pricePerSqFt}/SqFt</Text>
                    </TouchableOpacity>
                )} ListEmptyComponent={<Text style={{ textAlign: 'center', color: COLORS.textSub, padding: 20 }}>No products available</Text>} />
                <TouchableOpacity style={s.modalCancel} onPress={() => setProductPickerVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 9 },
    headerText: { flex: 1 }, headerEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 2, marginBottom: 2 }, headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }, statsText: { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { marginTop: 12, color: COLORS.textSub, fontSize: 14 },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 }, listContentEmpty: { flex: 1 },
    row: { backgroundColor: COLORS.white, borderRadius: 14, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
    rowBody: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 10 }, rowInfo: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 }, rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { fontSize: 12, fontWeight: '600' }, metaText: { fontSize: 12, color: COLORS.textSub }, subText: { fontSize: 12, color: COLORS.textSub, marginBottom: 2 },
    rowActions: { flexDirection: 'column', gap: 6 }, actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 70, justifyContent: 'center' },
    updateBtn: { backgroundColor: COLORS.accentLight }, deleteBtn: { backgroundColor: COLORS.dangerLight }, actionText: { fontSize: 12, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }, emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 }, emptySub: { fontSize: 14, color: COLORS.textSub, marginTop: 6, textAlign: 'center' },
    fab: { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, modalContent: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: '80%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
    modalOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: COLORS.bg }, modalOptionActive: { backgroundColor: COLORS.accentLight, borderWidth: 1, borderColor: COLORS.accent },
    modalOptionText: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary, textAlign: 'center' }, modalOptionTextActive: { color: COLORS.accent, fontWeight: '700' },
    modalCancel: { paddingVertical: 12, marginTop: 4 }, modalCancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textSub, textAlign: 'center' },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: COLORS.white, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', fontSize: 15, justifyContent: 'center' },
    totalPreview: { fontSize: 14, fontWeight: '700', color: COLORS.teal, marginTop: 10, textAlign: 'right' },
    submitBtn: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' }, submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default PurchaseOrderManagementScreen;
