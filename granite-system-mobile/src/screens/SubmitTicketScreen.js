import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import orderService from '../api/orderService';
import ticketService from '../api/ticketService';
import productService from '../api/productService';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';

const TYPES = ['Review', 'Support'];

const SubmitTicketScreen = ({ navigation, route }) => {
    const { logout } = useAuth();
    const presetType = route?.params?.type || 'Support';
    const presetOrderId = route?.params?.orderId || null;
    const [subject, setSubject] = useState(''); const [description, setDescription] = useState('');
    const [type, setType] = useState(presetType); const [submitting, setSubmitting] = useState(false);
    const [typePickerVisible, setTypePickerVisible] = useState(false); const [orderPickerVisible, setOrderPickerVisible] = useState(false);
    const [rating, setRating] = useState(5);
    const [orders, setOrders] = useState([]); const [selectedOrder, setSelectedOrder] = useState(presetOrderId); const [loadingOrders, setLoadingOrders] = useState(false);
    const [errors, setErrors] = useState({});

    useFocusEffect(useCallback(() => { fetchMyOrders(); }, []));
    const fetchMyOrders = async () => { setLoadingOrders(true); try { const res = await orderService.getMyOrders(); setOrders(res.data.orders ?? res.data ?? []); } catch (e) { setOrders([]); } finally { setLoadingOrders(false); } };
    const getOrderLabel = (orderId) => { const o = orders.find(o => o._id === orderId); if (!o) return 'Select an order...'; const date = new Date(o.createdAt).toLocaleDateString(); return `#${o._id.slice(-6).toUpperCase()} — LKR ${o.totalPrice?.toLocaleString()} (${date})`; };
    const validateForm = () => {
        let newErrors = {};
        if (!selectedOrder) newErrors.order = 'Please select an order.';
        if (!subject.trim()) newErrors.subject = 'Subject is required.';
        else if (subject.trim().length < 3) newErrors.subject = 'Must be at least 3 characters.';
        else if (/^\d+$/.test(subject.trim())) newErrors.subject = 'Cannot contain only numbers.';
        if (!description.trim()) newErrors.description = 'Description is required.';
        else if (description.trim().length < 10) newErrors.description = 'Must be at least 10 characters.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async () => { if (!validateForm()) return; setSubmitting(true); try { const userId = await AsyncStorage.getItem('userId'); if (!userId) { Alert.alert('Error', 'Please log in again.'); await logout(); return; } if (type === 'Review') { await productService.submitReview({ orderId: selectedOrder, subject: subject.trim(), description: description.trim(), rating }); } else { await ticketService.create({ user: userId, order: selectedOrder, subject: subject.trim(), description: description.trim(), type }); } Alert.alert('Submitted!', type === 'Review' ? 'Thank you for your review!' : 'Your support ticket has been submitted. We\'ll get back to you soon.', [{ text: 'OK', onPress: () => navigation.goBack() }]); } catch (e) { Alert.alert('Error', e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Could not submit. Please try again.'); } finally { setSubmitting(false); } };

    return (
        <SafeAreaView style={st.container} edges={['top']}><StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={st.header}><TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={THEME.textPrimary} /></TouchableOpacity><View style={st.headerText}><Text style={st.headerEyebrow}>HERITAGE SLABS</Text><Text style={st.headerTitle}>{type === 'Review' ? 'Write a Review' : 'Contact Support'}</Text></View></View>
            <ScrollView contentContainerStyle={st.formContent} showsVerticalScrollIndicator={false}>
                <Text style={st.label}>Type</Text>
                <TouchableOpacity style={st.input} onPress={() => setTypePickerVisible(true)}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name={type === 'Review' ? 'star-outline' : 'headset'} size={20} color={THEME.gold} /><Text style={{ fontSize: 15, color: THEME.textPrimary }}>{type}</Text></View></TouchableOpacity>
                <Text style={st.label}>Related Order *</Text>
                <TouchableOpacity style={[st.input, errors.order && st.inputError]} onPress={() => {setOrderPickerVisible(true); if(errors.order) setErrors({...errors, order: null});}}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name="clipboard-list-outline" size={20} color={selectedOrder ? THEME.gold : THEME.textMuted} /><Text style={{ fontSize: 14, color: selectedOrder ? THEME.textPrimary : THEME.textMuted, flex: 1 }} numberOfLines={1}>{getOrderLabel(selectedOrder)}</Text></View></TouchableOpacity>
                {errors.order && <Text style={st.errorText}>{errors.order}</Text>}
                {type === 'Review' && (
                    <View>
                        <Text style={st.label}>Rating</Text>
                        <View style={{flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8}}>
                            {[1,2,3,4,5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <MaterialCommunityIcons name="star" size={32} color={star <= rating ? "#FFD700" : "rgba(255,255,255,0.2)"} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
                <Text style={st.label}>Subject</Text>
                <TextInput style={[st.input, errors.subject && st.inputError]} placeholder={type === 'Review' ? 'e.g. Great quality granite!' : 'e.g. Issue with my order'} placeholderTextColor={THEME.textMuted} value={subject} onChangeText={(t)=>{setSubject(t); if(errors.subject) setErrors({...errors, subject: null});}} />
                {errors.subject && <Text style={st.errorText}>{errors.subject}</Text>}
                <Text style={st.label}>Description</Text>
                <TextInput style={[st.input, { height: 120, textAlignVertical: 'top' }, errors.description && st.inputError]} placeholder={type === 'Review' ? 'Share your experience with our slabs...' : 'Describe your issue in detail...'} placeholderTextColor={THEME.textMuted} value={description} onChangeText={(t)=>{setDescription(t); if(errors.description) setErrors({...errors, description: null});}} multiline />
                {errors.description && <Text style={st.errorText}>{errors.description}</Text>}
                <TouchableOpacity style={[st.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={st.submitBtnText}>{type === 'Review' ? 'Submit Review' : 'Submit Ticket'}</Text>}</TouchableOpacity>
            </ScrollView>

            <Modal visible={typePickerVisible} transparent animationType="fade"><View style={st.modalOverlay}><View style={st.modalContent}>
                <Text style={st.modalTitle}>Select Type</Text>
                {TYPES.map(t => (<TouchableOpacity key={t} style={[st.modalOption, type === t && st.modalOptionActive]} onPress={() => { setType(t); setTypePickerVisible(false); }}><MaterialCommunityIcons name={t === 'Review' ? 'star-outline' : 'headset'} size={20} color={type === t ? THEME.gold : THEME.textSecondary} /><Text style={[st.modalOptionText, type === t && st.modalOptionTextActive]}>{t}</Text></TouchableOpacity>))}
                <TouchableOpacity style={st.modalCancel} onPress={() => setTypePickerVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>

            <Modal visible={orderPickerVisible} transparent animationType="fade"><View style={st.modalOverlay}><View style={[st.modalContent, { maxHeight: '60%' }]}>
                <Text style={st.modalTitle}>Select Order</Text>
                {loadingOrders ? <ActivityIndicator size="small" color={THEME.gold} /> : (
                    <ScrollView>{orders.length === 0 ? (<Text style={{ textAlign: 'center', color: THEME.textSecondary, paddingVertical: 20 }}>No orders found. Place an order first.</Text>) : orders.map(o => (
                        <TouchableOpacity key={o._id} style={[st.modalOption, selectedOrder === o._id && st.modalOptionActive]} onPress={() => { setSelectedOrder(o._id); setOrderPickerVisible(false); }}>
                            <View style={{ flex: 1 }}><Text style={[st.modalOptionText, selectedOrder === o._id && st.modalOptionTextActive]} numberOfLines={1}>#{o._id.slice(-6).toUpperCase()} — LKR {o.totalPrice?.toLocaleString()}</Text><Text style={{ fontSize: 11, color: THEME.textSecondary }}>{new Date(o.createdAt).toLocaleDateString()} • {o.status}</Text></View>
                        </TouchableOpacity>
                    ))}</ScrollView>
                )}
                <TouchableOpacity style={st.modalCancel} onPress={() => setOrderPickerVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: THEME.border },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 9 }, headerText: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.gold, letterSpacing: 2, marginBottom: 2 }, headerTitle: { fontSize: 22, fontWeight: '800', color: THEME.textPrimary },
    formContent: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 13, fontWeight: '600', color: THEME.textPrimary, marginBottom: 6, marginTop: 16 },
    input: { backgroundColor: THEME.bgInput, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, fontSize: 15, color: THEME.textPrimary },
    inputError: { borderColor: THEME.danger, backgroundColor: 'rgba(255,76,76,0.05)' },
    errorText: { color: THEME.danger, fontSize: 12, marginTop: 4, marginLeft: 4 },
    submitBtn: { backgroundColor: THEME.gold, padding: 16, borderRadius: 12, marginTop: 28, alignItems: 'center', shadowColor: THEME.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' }, modalContent: { backgroundColor: 'rgba(20,20,40,0.95)', borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: THEME.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textPrimary, marginBottom: 16, textAlign: 'center' },
    modalOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
    modalOptionActive: { backgroundColor: THEME.goldLight, borderWidth: 1, borderColor: THEME.gold },
    modalOptionText: { fontSize: 15, fontWeight: '500', color: THEME.textPrimary }, modalOptionTextActive: { color: THEME.gold, fontWeight: '700' },
    modalCancel: { paddingVertical: 12, marginTop: 4 }, modalCancelText: { fontSize: 15, fontWeight: '600', color: THEME.textSecondary, textAlign: 'center' },
});

export default SubmitTicketScreen;
