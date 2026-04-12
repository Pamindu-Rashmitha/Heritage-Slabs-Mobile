import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import orderService from '../api/orderService';
import { THEME } from '../theme';

const CartScreen = ({ navigation }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCVV, setCardCVV] = useState('');
    const [paymentPickerVisible, setPaymentPickerVisible] = useState(false);

    useFocusEffect(useCallback(() => { loadCart(); }, []));

    const loadCart = async () => { setLoading(true); try { const cartData = await AsyncStorage.getItem('cart'); setCart(cartData ? JSON.parse(cartData) : []); } catch (e) { setCart([]); } finally { setLoading(false); } };
    const saveCart = async (newCart) => { setCart(newCart); await AsyncStorage.setItem('cart', JSON.stringify(newCart)); };
    const removeItem = (productId) => { Alert.alert('Remove Item', 'Remove this item from cart?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => saveCart(cart.filter(i => i._id !== productId)) }]); };
    const updateQty = (productId, delta) => { const updated = cart.map(item => { if (item._id === productId) { const newQty = Math.max(1, (item.qty || 1) + delta); return { ...item, qty: newQty }; } return item; }); saveCart(updated); };
    const getTotal = () => cart.reduce((sum, item) => sum + (item.pricePerSqFt * (item.qty || 1)), 0);

    const validateCheckout = () => {
        if (cart.length === 0) { Alert.alert('Empty Cart', 'Add some products first.'); return false; }
        if (!shippingAddress.trim()) { Alert.alert('Validation Error', 'Shipping address is required.'); return false; }
        if (shippingAddress.trim().length < 5) { Alert.alert('Validation Error', 'Shipping address must be at least 5 characters.'); return false; }
        if (paymentMethod === 'Card') {
            if (!cardNumber.trim()) { Alert.alert('Validation Error', 'Card number is required.'); return false; }
            const cleanCard = cardNumber.replace(/\s/g, '');
            if (!/^\d{16}$/.test(cleanCard)) { Alert.alert('Validation Error', 'Card number must be 16 digits.'); return false; }
            if (!cardExpiry.trim()) { Alert.alert('Validation Error', 'Expiry date is required.'); return false; }
            if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) { Alert.alert('Validation Error', 'Expiry must be in MM/YY format.'); return false; }
            if (!cardCVV.trim()) { Alert.alert('Validation Error', 'CVV is required.'); return false; }
            if (!/^\d{3}$/.test(cardCVV.trim())) { Alert.alert('Validation Error', 'CVV must be 3 digits.'); return false; }
        }
        return true;
    };

    const handlePlaceOrder = async () => {
        if (!validateCheckout()) return;
        setPlacing(true);
        try {
            const cleanCard = cardNumber.replace(/\s/g, '');
            const body = { products: cart.map(i => ({ productId: i._id, qty: i.qty || 1 })), totalPrice: getTotal(), shippingAddress: shippingAddress.trim(), paymentMethod, cardLastFour: paymentMethod === 'Card' ? cleanCard.slice(-4) : undefined };
            await orderService.create(body);
            await AsyncStorage.removeItem('cart');
            setCart([]);
            Alert.alert('Order Placed!', paymentMethod === 'Card' ? 'Payment successful! Your order is confirmed.' : 'Your order has been placed. Pay on delivery.', [{ text: 'View My Orders', onPress: () => navigation.navigate('MyOrders') }, { text: 'OK' }]);
        } catch (e) { Alert.alert('Order Failed', e.response?.data?.message || 'Could not place order.'); }
        finally { setPlacing(false); }
    };

    const renderCartItem = ({ item }) => (
        <View style={st.row}>
            <View style={st.rowInfo}><Text style={st.rowName} numberOfLines={1}>{item.stoneName}</Text><Text style={st.priceText}>LKR {item.pricePerSqFt}/SqFt</Text></View>
            <View style={st.qtyRow}>
                <TouchableOpacity style={st.qtyBtn} onPress={() => updateQty(item._id, -1)}><Text style={st.qtyBtnText}>−</Text></TouchableOpacity>
                <Text style={st.qtyText}>{item.qty || 1}</Text>
                <TouchableOpacity style={st.qtyBtn} onPress={() => updateQty(item._id, 1)}><Text style={st.qtyBtnText}>+</Text></TouchableOpacity>
            </View>
            <Text style={st.itemTotal}>LKR {(item.pricePerSqFt * (item.qty || 1)).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => removeItem(item._id)} style={st.removeBtn}><MaterialCommunityIcons name="close-circle" size={22} color={THEME.danger} /></TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={st.header}>
                <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={THEME.textPrimary} /></TouchableOpacity>
                <View style={st.headerText}><Text style={st.headerEyebrow}>HERITAGE SLABS</Text><Text style={st.headerTitle}>My Cart</Text></View>
            </View>

            {loading ? (
                <View style={st.centered}><ActivityIndicator size="large" color={THEME.gold} /><Text style={st.loadingText}>Loading Cart…</Text></View>
            ) : cart.length === 0 ? (
                <View style={st.centered}><MaterialCommunityIcons name="cart-off" size={72} color={THEME.textMuted} /><Text style={st.emptyTitle}>Cart is Empty</Text><Text style={st.emptySub}>Browse the catalogue and add some slabs!</Text></View>
            ) : (
                <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={st.sectionTitle}>Items ({cart.length})</Text>
                    {cart.map(item => <View key={item._id}>{renderCartItem({ item })}</View>)}
                    <View style={st.totalRow}><Text style={st.totalLabel}>Total</Text><Text style={st.totalValue}>LKR {getTotal().toLocaleString()}</Text></View>
                    <Text style={st.sectionTitle}>Shipping Address</Text>
                    <TextInput style={st.input} placeholder="Enter full delivery address" placeholderTextColor={THEME.textMuted} value={shippingAddress} onChangeText={setShippingAddress} multiline />
                    <Text style={st.sectionTitle}>Payment Method</Text>
                    <TouchableOpacity style={st.input} onPress={() => setPaymentPickerVisible(true)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name={paymentMethod === 'Card' ? 'credit-card-outline' : 'cash'} size={20} color={THEME.gold} />
                            <Text style={{ fontSize: 15, color: THEME.textPrimary }}>{paymentMethod}</Text>
                        </View>
                    </TouchableOpacity>
                    {paymentMethod === 'Card' && (
                        <View style={st.cardSection}>
                            <View style={st.cardHeader}><MaterialCommunityIcons name="shield-check" size={16} color={THEME.gold} /><Text style={st.cardSecureText}>Secure Payment</Text></View>
                            <Text style={st.label}>Card Number</Text>
                            <TextInput style={st.input} placeholder="1234 5678 9012 3456" placeholderTextColor={THEME.textMuted} value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" maxLength={19} />
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}><Text style={st.label}>Expiry</Text><TextInput style={st.input} placeholder="MM/YY" placeholderTextColor={THEME.textMuted} value={cardExpiry} onChangeText={setCardExpiry} maxLength={5} /></View>
                                <View style={{ flex: 1 }}><Text style={st.label}>CVV</Text><TextInput style={st.input} placeholder="123" placeholderTextColor={THEME.textMuted} value={cardCVV} onChangeText={setCardCVV} keyboardType="numeric" maxLength={3} secureTextEntry /></View>
                            </View>
                        </View>
                    )}
                    <TouchableOpacity style={[st.placeOrderBtn, placing && { opacity: 0.6 }]} onPress={handlePlaceOrder} disabled={placing} activeOpacity={0.85}>
                        {placing ? <ActivityIndicator color="#fff" /> : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialCommunityIcons name={paymentMethod === 'Card' ? 'lock' : 'cart-check'} size={20} color="#fff" />
                                <Text style={st.placeOrderText}>{paymentMethod === 'Card' ? `Pay & Place Order — LKR ${getTotal().toLocaleString()}` : `Place Order — LKR ${getTotal().toLocaleString()}`}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
            <Modal visible={paymentPickerVisible} transparent animationType="fade">
                <View style={st.modalOverlay}><View style={st.modalContent}>
                    <Text style={st.modalTitle}>Payment Method</Text>
                    {['Card', 'Cash on Delivery'].map(m => (
                        <TouchableOpacity key={m} style={[st.modalOption, paymentMethod === m && st.modalOptionActive]} onPress={() => { setPaymentMethod(m); setPaymentPickerVisible(false); }}>
                            <MaterialCommunityIcons name={m === 'Card' ? 'credit-card-outline' : 'cash'} size={20} color={paymentMethod === m ? THEME.gold : THEME.textSecondary} />
                            <Text style={[st.modalOptionText, paymentMethod === m && st.modalOptionTextActive]}>{m}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={st.modalCancel} onPress={() => setPaymentPickerVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
                </View></View>
            </Modal>
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: THEME.border },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 9 },
    headerText: { flex: 1 }, headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.gold, letterSpacing: 2, marginBottom: 2 }, headerTitle: { fontSize: 22, fontWeight: '800', color: THEME.textPrimary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { marginTop: 12, color: THEME.textSecondary, fontSize: 14 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: THEME.textPrimary, marginTop: 16 }, emptySub: { fontSize: 14, color: THEME.textSecondary, marginTop: 6, textAlign: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: THEME.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10, marginTop: 16 },
    row: { backgroundColor: THEME.bgCard, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: THEME.border },
    rowInfo: { flex: 1 }, rowName: { fontSize: 15, fontWeight: '700', color: THEME.textPrimary, marginBottom: 2 }, priceText: { fontSize: 12, color: THEME.textSecondary },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' }, qtyBtnText: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary }, qtyText: { fontSize: 15, fontWeight: '600', color: THEME.textPrimary, minWidth: 20, textAlign: 'center' },
    itemTotal: { fontSize: 14, fontWeight: '700', color: THEME.gold, minWidth: 65, textAlign: 'right' },
    removeBtn: { padding: 4 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: THEME.bgCard, borderRadius: 12, padding: 16, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: THEME.border },
    totalLabel: { fontSize: 16, fontWeight: '600', color: THEME.textPrimary }, totalValue: { fontSize: 20, fontWeight: '800', color: THEME.gold },
    label: { fontSize: 13, fontWeight: '600', color: THEME.textPrimary, marginBottom: 6, marginTop: 8 },
    input: { backgroundColor: THEME.bgInput, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, fontSize: 15, color: THEME.textPrimary },
    cardSection: { backgroundColor: THEME.bgCard, borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 1, borderColor: THEME.goldLight },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }, cardSecureText: { fontSize: 12, fontWeight: '600', color: THEME.gold },
    placeOrderBtn: { backgroundColor: THEME.gold, padding: 16, borderRadius: 12, marginTop: 24, alignItems: 'center', shadowColor: THEME.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' }, modalContent: { backgroundColor: 'rgba(20,20,40,0.95)', borderRadius: 20, padding: 24, width: '80%', borderWidth: 1, borderColor: THEME.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textPrimary, marginBottom: 16, textAlign: 'center' },
    modalOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
    modalOptionActive: { backgroundColor: THEME.goldLight, borderWidth: 1, borderColor: THEME.gold },
    modalOptionText: { fontSize: 15, fontWeight: '500', color: THEME.textPrimary }, modalOptionTextActive: { color: THEME.gold, fontWeight: '700' },
    modalCancel: { paddingVertical: 12, marginTop: 4 }, modalCancelText: { fontSize: 15, fontWeight: '600', color: THEME.textSecondary, textAlign: 'center' },
});

export default CartScreen;
