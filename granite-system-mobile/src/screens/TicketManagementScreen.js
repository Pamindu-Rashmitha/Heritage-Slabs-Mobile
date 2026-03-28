import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';

const COLORS = { dark:'#1e2235', accent:'#e9c46a', accentLight:'#fdf8e8', danger:'#e63946', dangerLight:'#fdecea', bg:'#f0f2f5', white:'#ffffff', textPrimary:'#1e2235', textSub:'#6b7280', border:'#e5e7eb', teal:'#2a9d8f', tealLight:'#e8f5f4' };
const STATUS_FLOW = ['Open','In Progress','Resolved'];
const getStatusColor = (s) => { if(s==='Open') return {text:'#e63946',bg:'#fdecea'}; if(s==='In Progress') return {text:'#f4a261',bg:'#fdf3ea'}; if(s==='Resolved') return {text:'#2a9d8f',bg:'#e8f5f4'}; return {text:COLORS.textSub,bg:COLORS.bg}; };
const getTypeColor = (t) => t==='Review'?{text:'#7b2d8b',bg:'#f3e8f8'}:{text:'#4361ee',bg:'#eaedfc'};

const TicketRow = ({ item, onOpen, onDelete }) => {
    const sc = getStatusColor(item.status);
    const tc = getTypeColor(item.type);
    return (
        <TouchableOpacity style={st.row} onPress={() => onOpen(item)} activeOpacity={0.85}>
            <View style={st.rowBody}><View style={st.rowInfo}>
                <Text style={st.rowName} numberOfLines={1}>{item.subject}</Text>
                <View style={st.rowMeta}>
                    <View style={[st.badge,{backgroundColor:sc.bg}]}><Text style={[st.badgeText,{color:sc.text}]}>{item.status}</Text></View>
                    <View style={[st.badge,{backgroundColor:tc.bg}]}><Text style={[st.badgeText,{color:tc.text}]}>{item.type}</Text></View>
                </View>
                <Text style={st.subText}>By: {item.user?.name||'Unknown'} • Order #{item.order?._id?.slice(-6).toUpperCase()||'N/A'}</Text>
                <Text style={st.descText} numberOfLines={2}>{item.description}</Text>
                {item.adminReply ? (
                    <View style={st.replyPreview}><MaterialCommunityIcons name="reply" size={12} color={COLORS.teal} /><Text style={st.replyPreviewText} numberOfLines={1}>Admin replied</Text></View>
                ) : null}
            </View>
            <View style={st.rowActions}>
                <TouchableOpacity style={[st.actionBtn,st.updateBtn]} onPress={() => onOpen(item)} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="eye-outline" size={18} color="#b8860b" /><Text style={[st.actionText,{color:'#b8860b'}]}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.actionBtn,st.deleteBtn]} onPress={() => onDelete(item)} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} /><Text style={[st.actionText,{color:COLORS.danger}]}>Delete</Text>
                </TouchableOpacity>
            </View></View>
        </TouchableOpacity>
    );
};

const TicketManagementScreen = ({ navigation }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [updating, setUpdating] = useState(false);

    useFocusEffect(useCallback(() => { fetchTickets(); }, []));

    const fetchTickets = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await api.get('/tickets', { headers: { Authorization: `Bearer ${token}` } });
            setTickets(res.data.tickets ?? res.data ?? []);
        } catch (e) { Alert.alert('Fetch Error', 'Could not load tickets.'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const openDetail = (item) => {
        setSelectedTicket(item);
        setReplyText(item.adminReply || '');
        setNewStatus(item.status);
        setDetailModalVisible(true);
    };

    const handleUpdate = async () => {
        if (!selectedTicket) return;
        setUpdating(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const payload = { status: newStatus };
            if (replyText.trim()) payload.adminReply = replyText.trim();
            await api.put(`/tickets/${selectedTicket._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            setTickets(p => p.map(t => t._id === selectedTicket._id ? { ...t, status: newStatus, adminReply: replyText.trim() || t.adminReply } : t));
            setDetailModalVisible(false);
            Alert.alert('Updated', 'Ticket has been updated successfully.');
        } catch (e) { Alert.alert('Update Failed', 'Could not update ticket.'); }
        finally { setUpdating(false); }
    };

    const handleDelete = (item) => {
        Alert.alert('Delete Ticket', `Delete "${item.subject}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
            try { const token = await AsyncStorage.getItem('userToken'); await api.delete(`/tickets/${item._id}`, { headers: { Authorization: `Bearer ${token}` } }); setTickets(p => p.filter(t => t._id !== item._id)); }
            catch (e) { Alert.alert('Delete Failed', 'Could not delete ticket.'); }
        }}]);
    };

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
            <View style={st.header}>
                <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} /></TouchableOpacity>
                <View style={st.headerText}><Text style={st.headerEyebrow}>ADMIN</Text><Text style={st.headerTitle}>Reviews & Tickets</Text></View>
            </View>
            {loading ? (
                <View style={st.centered}><ActivityIndicator size="large" color="#b8860b" /><Text style={st.loadingText}>Loading Tickets…</Text></View>
            ) : (
                <>
                    <View style={st.statsBar}><Text style={st.statsText}>{tickets.length} {tickets.length === 1 ? 'Ticket' : 'Tickets'}</Text></View>
                    <FlatList data={tickets} keyExtractor={i => i._id} renderItem={({ item }) => (
                        <TicketRow item={item} onOpen={openDetail} onDelete={handleDelete} />
                    )} contentContainerStyle={[st.listContent, tickets.length === 0 && st.listContentEmpty]}
                        ListEmptyComponent={<View style={st.emptyContainer}><MaterialCommunityIcons name="face-agent" size={72} color={COLORS.border} /><Text style={st.emptyTitle}>No Tickets Yet</Text><Text style={st.emptySub}>Customer tickets will appear here.</Text></View>}
                        refreshing={refreshing} onRefresh={() => fetchTickets(true)} showsVerticalScrollIndicator={false} />
                </>
            )}

            {/* Detail + Reply Modal */}
            <Modal visible={detailModalVisible} transparent animationType="fade">
                <View style={st.modalOverlay}><View style={st.detailModalContent}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={st.modalTitle}>Ticket Details</Text>

                        <Text style={st.detailLabel}>Subject</Text>
                        <Text style={st.detailValue}>{selectedTicket?.subject}</Text>

                        <Text style={st.detailLabel}>Customer</Text>
                        <Text style={st.detailValue}>{selectedTicket?.user?.name || 'Unknown'} ({selectedTicket?.user?.email || '-'})</Text>

                        <Text style={st.detailLabel}>Order</Text>
                        <Text style={st.detailValue}>
                            #{selectedTicket?.order?._id?.slice(-6).toUpperCase() || 'N/A'}
                            {selectedTicket?.order?.totalPrice ? ` — LKR ${selectedTicket.order.totalPrice.toLocaleString()}` : ''}
                        </Text>

                        <Text style={st.detailLabel}>Type</Text>
                        <View style={[st.badge, { backgroundColor: getTypeColor(selectedTicket?.type).bg, alignSelf: 'flex-start' }]}>
                            <Text style={[st.badgeText, { color: getTypeColor(selectedTicket?.type).text }]}>{selectedTicket?.type}</Text>
                        </View>

                        <Text style={st.detailLabel}>Description</Text>
                        <Text style={st.detailValue}>{selectedTicket?.description}</Text>

                        <Text style={st.detailLabel}>Status</Text>
                        <View style={st.statusRow}>
                            {STATUS_FLOW.map(s => (
                                <TouchableOpacity key={s} style={[st.statusChip, newStatus === s && st.statusChipActive]} onPress={() => setNewStatus(s)}>
                                    <Text style={[st.statusChipText, newStatus === s && st.statusChipTextActive]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={st.detailLabel}>Admin Reply</Text>
                        <TextInput
                            style={st.replyInput}
                            placeholder="Type your reply to the customer..."
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                        />

                        <TouchableOpacity style={[st.saveBtn, updating && { opacity: 0.6 }]} onPress={handleUpdate} disabled={updating} activeOpacity={0.85}>
                            {updating ? <ActivityIndicator color="#fff" /> : <Text style={st.saveBtnText}>Save Changes</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={st.modalCancel} onPress={() => setDetailModalVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
                    </ScrollView>
                </View></View>
            </Modal>
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 9 }, headerText: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 2, marginBottom: 2 }, headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }, statsText: { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { marginTop: 12, color: COLORS.textSub, fontSize: 14 },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 }, listContentEmpty: { flex: 1 },
    row: { backgroundColor: COLORS.white, borderRadius: 14, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
    rowBody: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 10 }, rowInfo: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 }, rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { fontSize: 12, fontWeight: '600' }, subText: { fontSize: 12, color: COLORS.textSub, marginBottom: 2 },
    descText: { fontSize: 12, color: COLORS.textSub, fontStyle: 'italic' },
    replyPreview: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: COLORS.tealLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    replyPreviewText: { fontSize: 11, fontWeight: '600', color: COLORS.teal },
    rowActions: { flexDirection: 'column', gap: 6 }, actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 70, justifyContent: 'center' },
    updateBtn: { backgroundColor: COLORS.accentLight }, deleteBtn: { backgroundColor: COLORS.dangerLight }, actionText: { fontSize: 12, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }, emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 }, emptySub: { fontSize: 14, color: COLORS.textSub, marginTop: 6, textAlign: 'center' },
    // Detail Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    detailModalContent: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
    detailLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSub, letterSpacing: 1, marginTop: 14, marginBottom: 4, textTransform: 'uppercase' },
    detailValue: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
    statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    statusChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
    statusChipActive: { backgroundColor: COLORS.accentLight, borderColor: '#b8860b' },
    statusChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textSub }, statusChipTextActive: { color: '#b8860b', fontWeight: '700' },
    replyInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 14, height: 100, textAlignVertical: 'top', marginTop: 4 },
    saveBtn: { backgroundColor: COLORS.teal, padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center', shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    modalCancel: { paddingVertical: 12, marginTop: 4 }, modalCancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textSub, textAlign: 'center' },
});

export default TicketManagementScreen;
