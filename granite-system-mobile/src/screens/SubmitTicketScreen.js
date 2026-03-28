import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';

const COLORS = { dark: '#1e2235', teal: '#2a9d8f', tealLight: '#e8f5f4', bg: '#f0f2f5', white: '#ffffff', textPrimary: '#1e2235', textSub: '#6b7280', border: '#e5e7eb' };
const TYPES = ['Review', 'Support'];

const SubmitTicketScreen = ({ navigation, route }) => {
    const presetType = route?.params?.type || 'Support';
    const presetOrderId = route?.params?.orderId || null;
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState(presetType);
    const [submitting, setSubmitting] = useState(false);
    const [typePickerVisible, setTypePickerVisible] = useState(false);
    const [orderPickerVisible, setOrderPickerVisible] = useState(false);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(presetOrderId);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useFocusEffect(useCallback(() => { fetchMyOrders(); }, []));

    const fetchMyOrders = async () => {
        setLoadingOrders(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await api.get('/orders/my', { headers: { Authorization: `Bearer ${token}` } });
            setOrders(res.data.orders ?? res.data ?? []);
        } catch (e) { setOrders([]); }
        finally { setLoadingOrders(false); }
    };

    const getOrderLabel = (orderId) => {
        const o = orders.find(o => o._id === orderId);
        if (!o) return 'Select an order...';
        const date = new Date(o.createdAt).toLocaleDateString();
        return `#${o._id.slice(-6).toUpperCase()} — LKR ${o.totalPrice?.toLocaleString()} (${date})`;
    };

    const validateForm = () => {
        if (!selectedOrder) { Alert.alert('Validation Error', 'Please select an order.'); return false; }
        if (!subject.trim()) { Alert.alert('Validation Error', 'Subject is required.'); return false; }
        if (subject.trim().length < 3) { Alert.alert('Validation Error', 'Subject must be at least 3 characters.'); return false; }
        if (/^\d+$/.test(subject.trim())) { Alert.alert('Validation Error', 'Subject cannot contain only numbers.'); return false; }
        if (!description.trim()) { Alert.alert('Validation Error', 'Description is required.'); return false; }
        if (description.trim().length < 10) { Alert.alert('Validation Error', 'Description must be at least 10 characters.'); return false; }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) { Alert.alert('Error', 'Please log in again.'); navigation.replace('Login'); return; }
            await api.post('/tickets', { user: userId, order: selectedOrder, subject: subject.trim(), description: description.trim(), type }, { headers: { Authorization: `Bearer ${token}` } });
            Alert.alert('Submitted!', type === 'Review' ? 'Thank you for your review!' : 'Your support ticket has been submitted. We\'ll get back to you soon.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Could not submit. Please try again.');
        } finally { setSubmitting(false); }
    };

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
            <View style={st.header}>
                <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} /></TouchableOpacity>
                <View style={st.headerText}><Text style={st.headerEyebrow}>HERITAGE SLABS</Text><Text style={st.headerTitle}>{type === 'Review' ? 'Write a Review' : 'Contact Support'}</Text></View>
            </View>
            <ScrollView contentContainerStyle={st.formContent} showsVerticalScrollIndicator={false}>
                <Text style={st.label}>Type</Text>
                <TouchableOpacity style={st.input} onPress={() => setTypePickerVisible(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name={type === 'Review' ? 'star-outline' : 'headset'} size={20} color={COLORS.teal} />
                        <Text style={{ fontSize: 15, color: COLORS.textPrimary }}>{type}</Text>
                    </View>
                </TouchableOpacity>

                <Text style={st.label}>Related Order *</Text>
                <TouchableOpacity style={st.input} onPress={() => setOrderPickerVisible(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={selectedOrder ? COLORS.teal : COLORS.textSub} />
                        <Text style={{ fontSize: 14, color: selectedOrder ? COLORS.textPrimary : COLORS.textSub, flex: 1 }} numberOfLines={1}>{getOrderLabel(selectedOrder)}</Text>
                    </View>
                </TouchableOpacity>

                <Text style={st.label}>Subject</Text>
                <TextInput style={st.input} placeholder={type === 'Review' ? 'e.g. Great quality granite!' : 'e.g. Issue with my order'} value={subject} onChangeText={setSubject} />

                <Text style={st.label}>Description</Text>
                <TextInput style={[st.input, { height: 120, textAlignVertical: 'top' }]} placeholder={type === 'Review' ? 'Share your experience with our slabs...' : 'Describe your issue in detail...'} value={description} onChangeText={setDescription} multiline />

                <TouchableOpacity style={[st.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={st.submitBtnText}>{type === 'Review' ? 'Submit Review' : 'Submit Ticket'}</Text>}
                </TouchableOpacity>
            </ScrollView>

            {/* Type Picker */}
            <Modal visible={typePickerVisible} transparent animationType="fade">
                <View style={st.modalOverlay}><View style={st.modalContent}>
                    <Text style={st.modalTitle}>Select Type</Text>
                    {TYPES.map(t => (
                        <TouchableOpacity key={t} style={[st.modalOption, type === t && st.modalOptionActive]} onPress={() => { setType(t); setTypePickerVisible(false); }}>
                            <MaterialCommunityIcons name={t === 'Review' ? 'star-outline' : 'headset'} size={20} color={type === t ? COLORS.teal : COLORS.textSub} />
                            <Text style={[st.modalOptionText, type === t && st.modalOptionTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={st.modalCancel} onPress={() => setTypePickerVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
                </View></View>
            </Modal>

            {/* Order Picker */}
            <Modal visible={orderPickerVisible} transparent animationType="fade">
                <View style={st.modalOverlay}><View style={[st.modalContent, { maxHeight: '60%' }]}>
                    <Text style={st.modalTitle}>Select Order</Text>
                    {loadingOrders ? <ActivityIndicator size="small" color={COLORS.teal} /> : (
                        <ScrollView>
                            {orders.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: COLORS.textSub, paddingVertical: 20 }}>No orders found. Place an order first.</Text>
                            ) : orders.map(o => (
                                <TouchableOpacity key={o._id} style={[st.modalOption, selectedOrder === o._id && st.modalOptionActive]}
                                    onPress={() => { setSelectedOrder(o._id); setOrderPickerVisible(false); }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[st.modalOptionText, selectedOrder === o._id && st.modalOptionTextActive]} numberOfLines={1}>
                                            #{o._id.slice(-6).toUpperCase()} — LKR {o.totalPrice?.toLocaleString()}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: COLORS.textSub }}>{new Date(o.createdAt).toLocaleDateString()} • {o.status}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    <TouchableOpacity style={st.modalCancel} onPress={() => setOrderPickerVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
                </View></View>
            </Modal>
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 9 }, headerText: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.teal, letterSpacing: 2, marginBottom: 2 }, headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    formContent: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6, marginTop: 16 },
    input: { backgroundColor: COLORS.white, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', fontSize: 15 },
    submitBtn: { backgroundColor: COLORS.teal, padding: 16, borderRadius: 12, marginTop: 28, alignItems: 'center', shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, modalContent: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: '85%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
    modalOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: COLORS.bg },
    modalOptionActive: { backgroundColor: COLORS.tealLight, borderWidth: 1, borderColor: COLORS.teal },
    modalOptionText: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary }, modalOptionTextActive: { color: COLORS.teal, fontWeight: '700' },
    modalCancel: { paddingVertical: 12, marginTop: 4 }, modalCancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textSub, textAlign: 'center' },
});

export default SubmitTicketScreen;
