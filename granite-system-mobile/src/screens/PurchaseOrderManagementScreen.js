import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import purchaseOrderService from '../api/purchaseOrderService';
import supplierService from '../api/supplierService';
import productService from '../api/productService';
import { THEME } from '../theme';

const STATUS_FLOW = ['Ordered', 'In Transit', 'Arrived', 'Cancelled'];
const getStatusColor = (s) => {
    if (s === 'Ordered') return { text: THEME.gold, bg: THEME.goldLight };
    if (s === 'In Transit') return { text: THEME.warning, bg: THEME.warningBg };
    if (s === 'Arrived') return { text: THEME.success, bg: THEME.successBg };
    if (s === 'Cancelled') return { text: THEME.danger, bg: THEME.dangerBg };
    return { text: THEME.textSecondary, bg: 'rgba(255,255,255,0.06)' };
};

const dateToYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const ymdToDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return new Date();
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const formatDateLabel = (value) => {
    if (!value) return 'Select expected arrival date';
    return ymdToDate(value).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

const PORow = ({ item, onUpdateStatus, onDelete }) => {
    const sc = getStatusColor(item.status);
    return (
        <View style={s.row}><View style={s.rowBody}><View style={s.rowInfo}>
            <Text style={s.rowName} numberOfLines={1}>{item.product?.stoneName || 'Product'}</Text>
            <View style={s.rowMeta}><View style={[s.badge, { backgroundColor: sc.bg }]}><Text style={[s.badgeText, { color: sc.text }]}>{item.status}</Text></View><Text style={s.metaText}>{item.quantityInSqFt} SqFt</Text></View>
            <Text style={s.subText}>Supplier: {item.supplier?.companyName || 'Unknown'}</Text>
            <Text style={s.subText}>Total: LKR {item.totalCost?.toLocaleString()}</Text>
            {item.expectedArrivalDate && <Text style={s.subText}>ETA: {new Date(item.expectedArrivalDate).toLocaleDateString()}</Text>}
        </View>
        <View style={s.rowActions}>
            <TouchableOpacity style={[s.actionBtn, s.updateBtn]} onPress={() => onUpdateStatus(item)} activeOpacity={0.8}><MaterialCommunityIcons name="swap-horizontal" size={18} color={THEME.gold} /><Text style={[s.actionText, { color: THEME.gold }]}>Status</Text></TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => onDelete(item)} activeOpacity={0.8}><MaterialCommunityIcons name="trash-can-outline" size={18} color={THEME.danger} /><Text style={[s.actionText, { color: THEME.danger }]}>Delete</Text></TouchableOpacity>
        </View></View></View>
    );
};

const PurchaseOrderManagementScreen = ({ navigation }) => {
    const [purchaseOrders, setPurchaseOrders] = useState([]); const [suppliers, setSuppliers] = useState([]); const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false); const [formModalVisible, setFormModalVisible] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState(''); const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(''); const [unitCost, setUnitCost] = useState(''); const [expectedDate, setExpectedDate] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [supplierPickerVisible, setSupplierPickerVisible] = useState(false); const [productPickerVisible, setProductPickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [errors, setErrors] = useState({});

    useFocusEffect(useCallback(() => { fetchAllData(); }, []));
    const fetchAllData = async (isRefresh = false) => { if (isRefresh) setRefreshing(true); else setLoading(true); try { const [poR, sR, pR] = await Promise.all([purchaseOrderService.getAll(), supplierService.getAll(), productService.getAll()]); setPurchaseOrders(poR.data.purchaseOrders ?? poR.data ?? []); setSuppliers(sR.data.suppliers ?? sR.data ?? []); setProducts(pR.data.products ?? pR.data ?? []); } catch (e) { Alert.alert('Fetch Error', 'Could not load data.'); } finally { setLoading(false); setRefreshing(false); } };
    const openAddForm = () => { setSelectedSupplierId(''); setSelectedProductId(''); setQuantity(''); setUnitCost(''); setExpectedDate(''); setDatePickerVisible(false); setFormModalVisible(true); };
    const validateForm = () => {
        let newErrors = {};
        if (!selectedSupplierId) newErrors.supplier = 'Please select a supplier.';
        if (!selectedProductId) newErrors.product = 'Please select a product.';
        if (!quantity.trim() || parseFloat(quantity) <= 0) newErrors.quantity = 'Must be a positive number.';
        if (!unitCost.trim() || parseFloat(unitCost) <= 0) newErrors.unitCost = 'Must be a positive number.';
        if (expectedDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(expectedDate.trim())) newErrors.expectedDate = 'Must be in YYYY-MM-DD format.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async () => { if (!validateForm()) return; setFormLoading(true); try { const payload = { supplier: selectedSupplierId, product: selectedProductId, quantityInSqFt: parseFloat(quantity), unitCost: parseFloat(unitCost) }; if (expectedDate.trim()) payload.expectedArrivalDate = expectedDate.trim(); await purchaseOrderService.create(payload); Alert.alert('Success', 'Purchase order created.'); setFormModalVisible(false); fetchAllData(); } catch (e) { Alert.alert('Error', e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Could not create purchase order.'); } finally { setFormLoading(false); } };
    const confirmStatusUpdate = async (newStatus) => { setStatusModalVisible(false); try { await purchaseOrderService.updateStatus(selectedPO._id, newStatus); if (newStatus === 'Arrived' && selectedPO.status !== 'Arrived') { Alert.alert('Stock Updated', `${selectedPO.product?.stoneName || 'Product'} stock increased by ${selectedPO.quantityInSqFt} SqFt.`); } fetchAllData(); } catch (e) { Alert.alert('Update Failed', 'Could not update status.'); } };
    const handleDelete = (item) => { const stockWarning = item.status === 'Arrived' ? '\n\nThis will also decrement the product stock.' : ''; Alert.alert('Delete Purchase Order', `Delete this purchase order?${stockWarning}`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await purchaseOrderService.delete(item._id); setPurchaseOrders(p => p.filter(po => po._id !== item._id)); } catch (e) { Alert.alert('Delete Failed', 'Could not delete this purchase order.'); } } }]); };
    const getSupplierLabel = () => { const su = suppliers.find(x => x._id === selectedSupplierId); return su ? su.companyName : 'Tap to select supplier'; };
    const getProductLabel = () => { const pr = products.find(x => x._id === selectedProductId); return pr ? `${pr.stoneName} (${pr.stockInSqFt} SqFt)` : 'Tap to select product'; };
    const computedTotal = (quantity && unitCost) ? (parseFloat(quantity) * parseFloat(unitCost)).toLocaleString() : '0';
    const webArrivalDateOptions = useMemo(() => {
        if (Platform.OS !== 'web') return [];
        const today = new Date();
        today.setHours(9, 0, 0, 0);
        return Array.from({ length: 180 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return d;
        });
    }, []);
    const selectedArrivalDate = ymdToDate(expectedDate);
    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setDatePickerVisible(false);
        if (event?.type === 'dismissed') return;
        if (selectedDate) {
            setExpectedDate(dateToYMD(selectedDate));
            if (errors.expectedDate) setErrors({ ...errors, expectedDate: null });
        }
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}><StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={s.header}><TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={THEME.textPrimary} /></TouchableOpacity><View style={s.headerText}><Text style={s.headerEyebrow}>ADMIN</Text><Text style={s.headerTitle}>Purchase Orders</Text></View></View>
            {loading ? (<View style={s.centered}><ActivityIndicator size="large" color={THEME.gold} /><Text style={s.loadingText}>Loading POs…</Text></View>) : (
                <><View style={s.statsBar}><Text style={s.statsText}>{purchaseOrders.length} {purchaseOrders.length === 1 ? 'Purchase Order' : 'Purchase Orders'}</Text></View>
                <FlatList data={purchaseOrders} keyExtractor={i => i._id} renderItem={({ item }) => (<PORow item={item} onUpdateStatus={i => { setSelectedPO(i); setStatusModalVisible(true); }} onDelete={handleDelete} />)}
                    contentContainerStyle={[s.listContent, purchaseOrders.length === 0 && s.listContentEmpty]}
                    ListEmptyComponent={<View style={s.emptyContainer}><MaterialCommunityIcons name="cart-arrow-down" size={72} color={THEME.textMuted} /><Text style={s.emptyTitle}>No Purchase Orders</Text><Text style={s.emptySub}>Tap + to create a purchase order.</Text></View>}
                    refreshing={refreshing} onRefresh={() => fetchAllData(true)} showsVerticalScrollIndicator={false} /></>
            )}
            <TouchableOpacity style={s.fab} onPress={openAddForm} activeOpacity={0.85}><MaterialCommunityIcons name="plus" size={30} color="#fff" /></TouchableOpacity>

            <Modal visible={statusModalVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={s.modalContent}>
                <Text style={s.modalTitle}>Update PO Status</Text>
                {STATUS_FLOW.map(st => (<TouchableOpacity key={st} style={[s.modalOption, selectedPO?.status === st && s.modalOptionActive]} onPress={() => confirmStatusUpdate(st)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}><Text style={[s.modalOptionText, selectedPO?.status === st && s.modalOptionTextActive]}>{st}</Text>{st === 'Arrived' && <MaterialCommunityIcons name="package-variant" size={16} color={selectedPO?.status === st ? THEME.success : THEME.textSecondary} />}</View>
                </TouchableOpacity>))}
                <TouchableOpacity style={s.modalCancel} onPress={() => setStatusModalVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>

            <Modal visible={formModalVisible} transparent animationType="slide"><View style={s.modalOverlay}><View style={[s.modalContent, { width: '90%' }]}>
                <Text style={s.modalTitle}>New Purchase Order</Text><ScrollView>
                <Text style={s.label}>Supplier</Text>
                <TouchableOpacity style={[s.input, errors.supplier && s.inputError]} onPress={() => {setSupplierPickerVisible(true); if(errors.supplier) setErrors({...errors, supplier: null});}}><Text style={{ color: selectedSupplierId ? THEME.textPrimary : THEME.textMuted, fontSize: 15 }}>{getSupplierLabel()}</Text></TouchableOpacity>
                {errors.supplier && <Text style={s.errorText}>{errors.supplier}</Text>}
                <Text style={s.label}>Product</Text>
                <TouchableOpacity style={[s.input, errors.product && s.inputError]} onPress={() => {setProductPickerVisible(true); if(errors.product) setErrors({...errors, product: null});}}><Text style={{ color: selectedProductId ? THEME.textPrimary : THEME.textMuted, fontSize: 15 }}>{getProductLabel()}</Text></TouchableOpacity>
                {errors.product && <Text style={s.errorText}>{errors.product}</Text>}
                <Text style={s.label}>Quantity (SqFt)</Text>
                <TextInput style={[s.input, errors.quantity && s.inputError]} placeholder="e.g. 500" placeholderTextColor={THEME.textMuted} value={quantity} onChangeText={(t)=>{setQuantity(t); if(errors.quantity) setErrors({...errors, quantity: null});}} keyboardType="numeric" />
                {errors.quantity && <Text style={s.errorText}>{errors.quantity}</Text>}
                <Text style={s.label}>Unit Cost (LKR per SqFt)</Text>
                <TextInput style={[s.input, errors.unitCost && s.inputError]} placeholder="e.g. 150" placeholderTextColor={THEME.textMuted} value={unitCost} onChangeText={(t)=>{setUnitCost(t); if(errors.unitCost) setErrors({...errors, unitCost: null});}} keyboardType="numeric" />
                {errors.unitCost && <Text style={s.errorText}>{errors.unitCost}</Text>}
                {quantity && unitCost ? <Text style={s.totalPreview}>Total Cost: LKR {computedTotal}</Text> : null}
                <Text style={s.label}>Expected Arrival Date</Text>
                <TouchableOpacity style={[s.input, errors.expectedDate && s.inputError]} onPress={()=>{setDatePickerVisible(true); if(errors.expectedDate) setErrors({...errors, expectedDate: null});}}>
                    <View style={s.dateInputRow}>
                        <MaterialCommunityIcons name="calendar-outline" size={20} color={THEME.gold} />
                        <Text style={{ color: expectedDate ? THEME.textPrimary : THEME.textMuted, fontSize: 15, flex: 1 }}>{formatDateLabel(expectedDate)}</Text>
                        {expectedDate ? (
                            <TouchableOpacity onPress={(event)=>{event.stopPropagation(); setExpectedDate('');}} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <MaterialCommunityIcons name="close-circle-outline" size={20} color={THEME.textSecondary} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </TouchableOpacity>
                {errors.expectedDate && <Text style={s.errorText}>{errors.expectedDate}</Text>}
                <TouchableOpacity style={[s.submitBtn, formLoading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={formLoading}>{formLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Create Purchase Order</Text>}</TouchableOpacity>
                <TouchableOpacity style={s.modalCancel} onPress={() => { setDatePickerVisible(false); setFormModalVisible(false); }}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
                </ScrollView></View></View></Modal>

            <Modal visible={supplierPickerVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={[s.modalContent, { width: '90%', maxHeight: '60%' }]}>
                <Text style={s.modalTitle}>Select Supplier</Text>
                <FlatList data={suppliers} keyExtractor={i => i._id} renderItem={({ item }) => (
                    <TouchableOpacity style={[s.modalOption, selectedSupplierId === item._id && s.modalOptionActive]} onPress={() => { setSelectedSupplierId(item._id); setSupplierPickerVisible(false); }}>
                        <Text style={[s.modalOptionText, selectedSupplierId === item._id && s.modalOptionTextActive]}>{item.companyName}</Text>
                        <Text style={{ fontSize: 11, color: THEME.textSecondary, textAlign: 'center' }}>{item.materialsSupplied}</Text>
                    </TouchableOpacity>
                )} ListEmptyComponent={<Text style={{ textAlign: 'center', color: THEME.textSecondary, padding: 20 }}>No suppliers available</Text>} />
                <TouchableOpacity style={s.modalCancel} onPress={() => setSupplierPickerVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>

            <Modal visible={productPickerVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={[s.modalContent, { width: '90%', maxHeight: '60%' }]}>
                <Text style={s.modalTitle}>Select Product</Text>
                <FlatList data={products} keyExtractor={i => i._id} renderItem={({ item }) => (
                    <TouchableOpacity style={[s.modalOption, selectedProductId === item._id && s.modalOptionActive]} onPress={() => { setSelectedProductId(item._id); setProductPickerVisible(false); }}>
                        <Text style={[s.modalOptionText, selectedProductId === item._id && s.modalOptionTextActive]}>{item.stoneName}</Text>
                        <Text style={{ fontSize: 11, color: THEME.textSecondary, textAlign: 'center' }}>Stock: {item.stockInSqFt} SqFt | LKR {item.pricePerSqFt}/SqFt</Text>
                    </TouchableOpacity>
                )} ListEmptyComponent={<Text style={{ textAlign: 'center', color: THEME.textSecondary, padding: 20 }}>No products available</Text>} />
                <TouchableOpacity style={s.modalCancel} onPress={() => setProductPickerVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>

            {Platform.OS === 'android' && datePickerVisible && (
                <DateTimePicker
                    value={selectedArrivalDate}
                    mode="date"
                    display="calendar"
                    onChange={handleDateChange}
                />
            )}

            <Modal visible={Platform.OS === 'ios' && datePickerVisible} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, s.datePickerModal]}>
                        <Text style={s.modalTitle}>Expected Arrival Date</Text>
                        <DateTimePicker
                            value={selectedArrivalDate}
                            mode="date"
                            display="inline"
                            themeVariant="dark"
                            onChange={handleDateChange}
                        />
                        <TouchableOpacity style={s.modalCancel} onPress={() => setDatePickerVisible(false)}>
                            <Text style={s.doneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={Platform.OS === 'web' && datePickerVisible} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { width: '90%', maxHeight: '70%' }]}>
                        <Text style={s.modalTitle}>Expected Arrival Date</Text>
                        <FlatList
                            data={webArrivalDateOptions}
                            keyExtractor={i => i.toISOString()}
                            renderItem={({ item }) => {
                                const itemValue = dateToYMD(item);
                                const isActive = expectedDate === itemValue;
                                return (
                                    <TouchableOpacity style={[s.modalOption, isActive && s.modalOptionActive]} onPress={() => { setExpectedDate(itemValue); if (errors.expectedDate) setErrors({ ...errors, expectedDate: null }); setDatePickerVisible(false); }}>
                                        <Text style={[s.modalOptionText, isActive && s.modalOptionTextActive]}>{formatDateLabel(itemValue)}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                            showsVerticalScrollIndicator={false}
                        />
                        <TouchableOpacity style={s.modalCancel} onPress={() => setDatePickerVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
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
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { fontSize: 12, fontWeight: '600' }, metaText: { fontSize: 12, color: THEME.textSecondary }, subText: { fontSize: 12, color: THEME.textSecondary, marginBottom: 2 },
    rowActions: { flexDirection: 'column', gap: 6 }, actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 70, justifyContent: 'center' },
    updateBtn: { backgroundColor: THEME.goldLight }, deleteBtn: { backgroundColor: THEME.dangerBg }, actionText: { fontSize: 12, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }, emptyTitle: { fontSize: 20, fontWeight: '700', color: THEME.textPrimary, marginTop: 16 }, emptySub: { fontSize: 14, color: THEME.textSecondary, marginTop: 6, textAlign: 'center' },
    fab: { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.gold, justifyContent: 'center', alignItems: 'center', shadowColor: THEME.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' }, modalContent: { backgroundColor: 'rgba(20,20,40,0.95)', borderRadius: 20, padding: 24, width: '80%', borderWidth: 1, borderColor: THEME.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textPrimary, marginBottom: 16, textAlign: 'center' },
    modalOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.06)' }, modalOptionActive: { backgroundColor: THEME.goldLight, borderWidth: 1, borderColor: THEME.gold },
    modalOptionText: { fontSize: 15, fontWeight: '500', color: THEME.textPrimary, textAlign: 'center' }, modalOptionTextActive: { color: THEME.gold, fontWeight: '700' },
    modalCancel: { paddingVertical: 12, marginTop: 4 }, modalCancelText: { fontSize: 15, fontWeight: '600', color: THEME.textSecondary, textAlign: 'center' },
    label: { fontSize: 13, fontWeight: '600', color: THEME.textPrimary, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: THEME.bgInput, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, fontSize: 15, justifyContent: 'center', color: THEME.textPrimary },
    dateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inputError: { borderColor: THEME.danger, backgroundColor: 'rgba(255,76,76,0.05)' },
    errorText: { color: THEME.danger, fontSize: 12, marginTop: 4, marginLeft: 4 },
    totalPreview: { fontSize: 14, fontWeight: '700', color: THEME.success, marginTop: 10, textAlign: 'right' },
    submitBtn: { backgroundColor: THEME.gold, padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center', shadowColor: THEME.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }, submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    datePickerModal: { maxWidth: 400, alignSelf: 'center' },
    doneText: { fontSize: 16, fontWeight: '700', color: THEME.gold, textAlign: 'center' },
});

export default PurchaseOrderManagementScreen;
