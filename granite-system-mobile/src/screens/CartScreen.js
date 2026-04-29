import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import orderService from '../api/orderService';
import { THEME } from '../theme';

const getUserCartKey = async () => {
    const userId = await AsyncStorage.getItem('userId');
    return userId ? `cart_${userId}` : 'cart';
};

const CITIES = [
    { name: 'Colombo', fee: 3500 },
    { name: 'Gampaha', fee: 4500 },
    { name: 'Negombo', fee: 4000 },
    { name: 'Kalutara', fee: 5000 },
    { name: 'Kurunegala', fee: 6500 },
    { name: 'Kandy', fee: 7500 },
    { name: 'Galle', fee: 8000 },
    { name: 'Matara', fee: 9000 },
    { name: 'Anuradhapura', fee: 10000 },
    { name: 'Jaffna', fee: 15000 },
    { name: 'Other', fee: 12000 },
];

const UNLOADING_ASSIST_FEE = 2500;
const VAT_RATE = 0.18;
const MAX_INSTRUCTIONS_LEN = 500;

const formatDate = (d) => {
    if (!d) return '';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

const CartScreen = ({ navigation }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);

    const [shippingAddress, setShippingAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [city, setCity] = useState(null);
    const [preferredDate, setPreferredDate] = useState(null);
    const [unloadingAssistance, setUnloadingAssistance] = useState(false);
    const [specialInstructions, setSpecialInstructions] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('Card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCVV, setCardCVV] = useState('');

    const [paymentPickerVisible, setPaymentPickerVisible] = useState(false);
    const [cityPickerVisible, setCityPickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    useFocusEffect(useCallback(() => { loadCart(); }, []));

    const loadCart = async () => { setLoading(true); try { const cartKey = await getUserCartKey(); const cartData = await AsyncStorage.getItem(cartKey); setCart(cartData ? JSON.parse(cartData) : []); } catch (e) { setCart([]); } finally { setLoading(false); } };
    const saveCart = async (newCart) => { setCart(newCart); const cartKey = await getUserCartKey(); await AsyncStorage.setItem(cartKey, JSON.stringify(newCart)); };
    const removeItem = (productId) => { Alert.alert('Remove Item', 'Remove this item from cart?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => saveCart(cart.filter(i => i._id !== productId)) }]); };
    const updateQty = (productId, delta) => { const updated = cart.map(item => { if (item._id === productId) { const newQty = Math.max(1, (item.qty || 1) + delta); return { ...item, qty: newQty }; } return item; }); saveCart(updated); };

    const minDeliveryDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        d.setHours(9, 0, 0, 0);
        return d;
    }, []);
    const maxDeliveryDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        d.setHours(9, 0, 0, 0);
        return d;
    }, []);

    const webDateOptions = useMemo(() => {
        if (Platform.OS !== 'web') return [];
        const options = [];
        const today = new Date();
        for (let i = 2; i <= 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            d.setHours(9, 0, 0, 0);
            options.push(d);
        }
        return options;
    }, []);

    const onAndroidDeliveryDateChange = useCallback((event, selectedDate) => {
        setDatePickerVisible(false);
        if (event.type === 'dismissed') return;
        if (selectedDate) {
            const x = new Date(selectedDate);
            x.setHours(9, 0, 0, 0);
            setPreferredDate(x);
        }
    }, []);

    const onIOSDeliveryDateChange = useCallback((_, selectedDate) => {
        if (selectedDate) {
            const x = new Date(selectedDate);
            x.setHours(9, 0, 0, 0);
            setPreferredDate(x);
        }
    }, []);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + (item.pricePerSqFt * (item.qty || 1)), 0),
        [cart]
    );
    const deliveryFee = useMemo(() => {
        const base = city ? city.fee : 0;
        return base + (unloadingAssistance ? UNLOADING_ASSIST_FEE : 0);
    }, [city, unloadingAssistance]);
    const tax = useMemo(() => Math.round(subtotal * VAT_RATE), [subtotal]);
    const grandTotal = subtotal + deliveryFee + tax;

    const validateCheckout = () => {
        if (cart.length === 0) { Alert.alert('Empty Cart', 'Add some products first.'); return false; }

        if (!shippingAddress.trim()) { Alert.alert('Validation Error', 'Shipping address is required.'); return false; }
        if (shippingAddress.trim().length < 5) { Alert.alert('Validation Error', 'Shipping address must be at least 5 characters.'); return false; }
        if (!/^\d+,\s*.+,\s*.+$/.test(shippingAddress.trim())) { Alert.alert('Validation Error', 'Address must follow the format: Street Number, Street Name, City (e.g. 123, Main Street, Colombo).'); return false; }

        const phoneClean = customerPhone.replace(/\s/g, '');
        if (!phoneClean) { Alert.alert('Validation Error', 'Phone number is required.'); return false; }
        if (!/^0\d{9}$/.test(phoneClean)) { Alert.alert('Validation Error', 'Phone number must be 10 digits starting with 0 (e.g. 0771234567).'); return false; }

        if (!city) { Alert.alert('Validation Error', 'Please select a delivery city.'); return false; }

        if (!preferredDate) { Alert.alert('Validation Error', 'Please select a preferred delivery date.'); return false; }
        const minDate = new Date(minDeliveryDate);
        minDate.setHours(0, 0, 0, 0);
        const chosen = new Date(preferredDate);
        chosen.setHours(0, 0, 0, 0);
        if (chosen < minDate) { Alert.alert('Validation Error', 'Delivery date must be at least 2 days from today.'); return false; }

        if (specialInstructions && specialInstructions.length > MAX_INSTRUCTIONS_LEN) {
            Alert.alert('Validation Error', `Special instructions cannot exceed ${MAX_INSTRUCTIONS_LEN} characters.`); return false;
        }

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
            const body = {
                products: cart.map(i => ({ productId: i._id, qty: i.qty || 1 })),
                subtotal,
                deliveryFee,
                tax,
                totalPrice: grandTotal,
                shippingAddress: shippingAddress.trim(),
                customerPhone: customerPhone.replace(/\s/g, ''),
                city: city.name,
                preferredDeliveryDate: preferredDate.toISOString(),
                unloadingAssistance,
                specialInstructions: specialInstructions.trim(),
                paymentMethod,
                cardLastFour: paymentMethod === 'Card' ? cleanCard.slice(-4) : undefined,
            };
            await orderService.create(body);
            const cartKey = await getUserCartKey();
            await AsyncStorage.removeItem(cartKey);
            setCart([]);
            Alert.alert(
                'Order Placed!',
                paymentMethod === 'Card' ? 'Payment successful! Your order is confirmed.' : 'Your order has been placed. Pay on delivery.',
                [{ text: 'View My Orders', onPress: () => navigation.navigate('CustomerTabs', { screen: 'MyOrders' }) }, { text: 'OK' }]
            );
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

                    <Text style={st.sectionTitle}>Contact Number</Text>
                    <TextInput
                        style={st.input}
                        placeholder="0771234567"
                        placeholderTextColor={THEME.textMuted}
                        value={customerPhone}
                        onChangeText={(t) => setCustomerPhone(t.replace(/[^\d]/g, ''))}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />

                    <Text style={st.sectionTitle}>Shipping Address</Text>
                    <TextInput style={st.input} placeholder="e.g. 123, Main Street, Colombo" placeholderTextColor={THEME.textMuted} value={shippingAddress} onChangeText={setShippingAddress} multiline />

                    <Text style={st.sectionTitle}>Delivery City</Text>
                    <TouchableOpacity style={st.input} onPress={() => setCityPickerVisible(true)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name="map-marker-outline" size={20} color={THEME.gold} />
                            <Text style={{ fontSize: 15, color: city ? THEME.textPrimary : THEME.textMuted }}>
                                {city ? `${city.name} — LKR ${city.fee.toLocaleString()} delivery` : 'Select a city'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={st.sectionTitle}>Preferred Delivery Date</Text>
                    <TouchableOpacity style={st.input} onPress={() => setDatePickerVisible(true)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name="calendar-outline" size={20} color={THEME.gold} />
                            <Text style={{ fontSize: 15, color: preferredDate ? THEME.textPrimary : THEME.textMuted }}>
                                {preferredDate ? formatDate(preferredDate) : 'Select a delivery date'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={st.toggleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={st.toggleTitle}>Unloading Assistance</Text>
                            <Text style={st.toggleSub}>Extra labor to offload heavy slabs (+LKR {UNLOADING_ASSIST_FEE.toLocaleString()})</Text>
                        </View>
                        <Switch
                            value={unloadingAssistance}
                            onValueChange={setUnloadingAssistance}
                            trackColor={{ false: 'rgba(255,255,255,0.15)', true: THEME.gold }}
                            thumbColor="#fff"
                        />
                    </View>

                    <Text style={st.sectionTitle}>Special Instructions <Text style={st.optionalBadge}>(optional)</Text></Text>
                    <TextInput
                        style={[st.input, { minHeight: 80, textAlignVertical: 'top' }]}
                        placeholder="e.g. call before arrival…"
                        placeholderTextColor={THEME.textMuted}
                        value={specialInstructions}
                        onChangeText={setSpecialInstructions}
                        maxLength={MAX_INSTRUCTIONS_LEN}
                        multiline
                    />
                    <Text style={st.helperText}>{specialInstructions.length}/{MAX_INSTRUCTIONS_LEN}</Text>

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

                    <View style={st.breakdownCard}>
                        <Text style={st.breakdownTitle}>Order Summary</Text>
                        <View style={st.breakdownRow}><Text style={st.breakdownLabel}>Subtotal</Text><Text style={st.breakdownValue}>LKR {subtotal.toLocaleString()}</Text></View>
                        <View style={st.breakdownRow}>
                            <Text style={st.breakdownLabel}>Delivery Fee{city ? ` (${city.name})` : ''}{unloadingAssistance ? ' + Unloading' : ''}</Text>
                            <Text style={st.breakdownValue}>LKR {deliveryFee.toLocaleString()}</Text>
                        </View>
                        <View style={st.breakdownRow}><Text style={st.breakdownLabel}>VAT ({Math.round(VAT_RATE * 100)}%)</Text><Text style={st.breakdownValue}>LKR {tax.toLocaleString()}</Text></View>
                        <View style={st.breakdownDivider} />
                        <View style={st.breakdownRow}><Text style={st.breakdownTotalLabel}>Grand Total</Text><Text style={st.breakdownTotalValue}>LKR {grandTotal.toLocaleString()}</Text></View>
                    </View>

                    <TouchableOpacity style={[st.placeOrderBtn, placing && { opacity: 0.6 }]} onPress={handlePlaceOrder} disabled={placing} activeOpacity={0.85}>
                        {placing ? <ActivityIndicator color="#fff" /> : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialCommunityIcons name={paymentMethod === 'Card' ? 'lock' : 'cart-check'} size={20} color="#fff" />
                                <Text style={st.placeOrderText}>{paymentMethod === 'Card' ? `Pay & Place Order — LKR ${grandTotal.toLocaleString()}` : `Place Order — LKR ${grandTotal.toLocaleString()}`}</Text>
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

            <Modal visible={cityPickerVisible} transparent animationType="fade">
                <View style={st.modalOverlay}><View style={st.modalContent}>
                    <Text style={st.modalTitle}>Delivery City</Text>
                    <ScrollView style={{ maxHeight: 360 }}>
                        {CITIES.map(c => (
                            <TouchableOpacity
                                key={c.name}
                                style={[st.modalOption, city?.name === c.name && st.modalOptionActive]}
                                onPress={() => { setCity(c); setCityPickerVisible(false); }}
                            >
                                <MaterialCommunityIcons name="map-marker-outline" size={20} color={city?.name === c.name ? THEME.gold : THEME.textSecondary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[st.modalOptionText, city?.name === c.name && st.modalOptionTextActive]}>{c.name}</Text>
                                    <Text style={st.modalOptionSub}>LKR {c.fee.toLocaleString()} delivery</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={st.modalCancel} onPress={() => setCityPickerVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
                </View></View>
            </Modal>

            {Platform.OS === 'android' && datePickerVisible && (
                <DateTimePicker
                    value={preferredDate || minDeliveryDate}
                    mode="date"
                    display="calendar"
                    minimumDate={minDeliveryDate}
                    maximumDate={maxDeliveryDate}
                    onChange={onAndroidDeliveryDateChange}
                />
            )}

            <Modal visible={Platform.OS === 'ios' && datePickerVisible} transparent animationType="fade">
                <View style={st.modalOverlay}>
                    <View style={[st.modalContent, st.datePickerModal]}>
                        <Text style={st.modalTitle}>Preferred Delivery Date</Text>
                        <DateTimePicker
                            value={preferredDate || minDeliveryDate}
                            mode="date"
                            display="inline"
                            themeVariant="dark"
                            minimumDate={minDeliveryDate}
                            maximumDate={maxDeliveryDate}
                            onChange={onIOSDeliveryDateChange}
                        />
                        <TouchableOpacity style={st.modalCancel} onPress={() => setDatePickerVisible(false)}>
                            <Text style={st.doneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={Platform.OS === 'web' && datePickerVisible} transparent animationType="fade">
                <View style={st.modalOverlay}>
                    <View style={st.modalContent}>
                        <Text style={st.modalTitle}>Preferred Delivery Date</Text>
                        <ScrollView style={{ maxHeight: 360 }}>
                            {webDateOptions.map((d) => {
                                const isActive = preferredDate && preferredDate.toDateString() === d.toDateString();
                                return (
                                    <TouchableOpacity
                                        key={d.toISOString()}
                                        style={[st.modalOption, isActive && st.modalOptionActive]}
                                        onPress={() => { setPreferredDate(d); setDatePickerVisible(false); }}
                                    >
                                        <MaterialCommunityIcons name="calendar-outline" size={20} color={isActive ? THEME.gold : THEME.textSecondary} />
                                        <Text style={[st.modalOptionText, isActive && st.modalOptionTextActive]}>{formatDate(d)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity style={st.modalCancel} onPress={() => setDatePickerVisible(false)}>
                            <Text style={st.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    optionalBadge: { fontSize: 11, fontWeight: '500', color: THEME.textMuted, textTransform: 'none', letterSpacing: 0 },
    helperText: { fontSize: 12, color: THEME.textMuted, marginTop: 6, marginLeft: 2 },
    row: { backgroundColor: THEME.bgCard, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: THEME.border },
    rowInfo: { flex: 1 }, rowName: { fontSize: 15, fontWeight: '700', color: THEME.textPrimary, marginBottom: 2 }, priceText: { fontSize: 12, color: THEME.textSecondary },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' }, qtyBtnText: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary }, qtyText: { fontSize: 15, fontWeight: '600', color: THEME.textPrimary, minWidth: 20, textAlign: 'center' },
    itemTotal: { fontSize: 14, fontWeight: '700', color: THEME.gold, minWidth: 65, textAlign: 'right' },
    removeBtn: { padding: 4 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: THEME.bgCard, borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: THEME.border },
    toggleTitle: { fontSize: 15, fontWeight: '700', color: THEME.textPrimary }, toggleSub: { fontSize: 12, color: THEME.textSecondary, marginTop: 2 },
    breakdownCard: { backgroundColor: THEME.bgCard, borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: THEME.border },
    breakdownTitle: { fontSize: 14, fontWeight: '700', color: THEME.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    breakdownLabel: { fontSize: 14, color: THEME.textSecondary, flex: 1, paddingRight: 8 },
    breakdownValue: { fontSize: 14, fontWeight: '600', color: THEME.textPrimary },
    breakdownDivider: { height: 1, backgroundColor: THEME.border, marginVertical: 8 },
    breakdownTotalLabel: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary },
    breakdownTotalValue: { fontSize: 20, fontWeight: '800', color: THEME.gold },
    label: { fontSize: 13, fontWeight: '600', color: THEME.textPrimary, marginBottom: 6, marginTop: 8 },
    input: { backgroundColor: THEME.bgInput, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, fontSize: 15, color: THEME.textPrimary },
    cardSection: { backgroundColor: THEME.bgCard, borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 1, borderColor: THEME.goldLight },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }, cardSecureText: { fontSize: 12, fontWeight: '600', color: THEME.gold },
    placeOrderBtn: { backgroundColor: THEME.gold, padding: 16, borderRadius: 12, marginTop: 24, alignItems: 'center', shadowColor: THEME.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' }, modalContent: { backgroundColor: 'rgba(20,20,40,0.95)', borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: THEME.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textPrimary, marginBottom: 16, textAlign: 'center' },
    modalOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
    modalOptionActive: { backgroundColor: THEME.goldLight, borderWidth: 1, borderColor: THEME.gold },
    modalOptionText: { fontSize: 15, fontWeight: '500', color: THEME.textPrimary }, modalOptionTextActive: { color: THEME.gold, fontWeight: '700' },
    modalOptionSub: { fontSize: 12, color: THEME.textSecondary, marginTop: 2 },
    modalCancel: { paddingVertical: 12, marginTop: 4 }, modalCancelText: { fontSize: 15, fontWeight: '600', color: THEME.textSecondary, textAlign: 'center' },
    datePickerModal: { maxWidth: 400, alignSelf: 'center' },
    doneText: { fontSize: 16, fontWeight: '700', color: THEME.gold, textAlign: 'center' },
});

export default CartScreen;
