import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';
import { THEME } from '../theme';

const getStatusColor = (s) => { if (s === 'Open') return { text: THEME.danger, bg: THEME.dangerBg }; if (s === 'In Progress') return { text: THEME.warning, bg: THEME.warningBg }; if (s === 'Resolved') return { text: THEME.success, bg: THEME.successBg }; return { text: THEME.textSecondary, bg: 'rgba(255,255,255,0.06)' }; };
const getTypeColor = (t) => t === 'Review' ? { text: THEME.purple, bg: THEME.purpleLight } : { text: THEME.info, bg: THEME.infoBg };

const TicketCard = ({ item }) => {
    const sc = getStatusColor(item.status); const tc = getTypeColor(item.type);
    const orderId = item.order?._id?.slice(-6).toUpperCase() || 'N/A';
    return (
        <View style={st.card}>
            <View style={st.cardTop}><Text style={st.subject} numberOfLines={1}>{item.subject}</Text><Text style={st.date}>{new Date(item.createdAt).toLocaleDateString()}</Text></View>
            <View style={st.badgeRow}>
                <View style={[st.badge, { backgroundColor: tc.bg }]}><Text style={[st.badgeText, { color: tc.text }]}>{item.type}</Text></View>
                <View style={[st.badge, { backgroundColor: sc.bg }]}><Text style={[st.badgeText, { color: sc.text }]}>{item.status}</Text></View>
                <View style={[st.badge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}><Text style={[st.badgeText, { color: THEME.textSecondary }]}>Order #{orderId}</Text></View>
            </View>
            <Text style={st.description} numberOfLines={3}>{item.description}</Text>
            {item.adminReply ? (
                <View style={st.replyBox}>
                    <View style={st.replyHeader}><MaterialCommunityIcons name="reply" size={14} color={THEME.success} /><Text style={st.replyLabel}>Admin Reply</Text></View>
                    <Text style={st.replyText}>{item.adminReply}</Text>
                </View>
            ) : (
                <View style={st.noReplyBox}><MaterialCommunityIcons name="clock-outline" size={14} color={THEME.textSecondary} /><Text style={st.noReplyText}>Awaiting admin response</Text></View>
            )}
        </View>
    );
};

const MyTicketsScreen = ({ navigation }) => {
    const [tickets, setTickets] = useState([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
    useFocusEffect(useCallback(() => { fetchMyTickets(); }, []));
    const fetchMyTickets = async (isRefresh = false) => { if (isRefresh) setRefreshing(true); else setLoading(true); try { const token = await AsyncStorage.getItem('userToken'); const res = await api.get('/tickets/my', { headers: { Authorization: `Bearer ${token}` } }); setTickets(res.data.tickets ?? res.data ?? []); } catch (e) { Alert.alert('Error', 'Could not load your tickets.'); } finally { setLoading(false); setRefreshing(false); } };

    return (
        <SafeAreaView style={st.container} edges={['top']}><StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={st.header}><TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={THEME.textPrimary} /></TouchableOpacity><View style={st.headerText}><Text style={st.headerEyebrow}>HERITAGE SLABS</Text><Text style={st.headerTitle}>My Tickets</Text></View></View>
            {loading ? (<View style={st.centered}><ActivityIndicator size="large" color={THEME.indigo} /><Text style={st.loadingText}>Loading Tickets…</Text></View>) : (
                <FlatList data={tickets} keyExtractor={i => i._id} renderItem={({ item }) => <TicketCard item={item} />}
                    contentContainerStyle={[st.listContent, tickets.length === 0 && st.listContentEmpty]}
                    ListEmptyComponent={<View style={st.centered}><MaterialCommunityIcons name="message-text-outline" size={72} color={THEME.textMuted} /><Text style={st.emptyTitle}>No Tickets Yet</Text><Text style={st.emptySub}>Submit a review or support ticket from your orders.</Text></View>}
                    refreshing={refreshing} onRefresh={() => fetchMyTickets(true)} showsVerticalScrollIndicator={false}
                    ListHeaderComponent={tickets.length > 0 ? (<View style={st.statsBar}><Text style={st.statsText}>{tickets.length} {tickets.length === 1 ? 'Ticket' : 'Tickets'}</Text></View>) : null} />
            )}
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: THEME.border },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 9 }, headerText: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.indigo, letterSpacing: 2, marginBottom: 2 }, headerTitle: { fontSize: 22, fontWeight: '800', color: THEME.textPrimary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { marginTop: 12, color: THEME.textSecondary, fontSize: 14 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: THEME.textPrimary, marginTop: 16 }, emptySub: { fontSize: 14, color: THEME.textSecondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
    statsBar: { paddingHorizontal: 4, paddingVertical: 8 }, statsText: { fontSize: 13, color: THEME.textSecondary, fontWeight: '500' },
    listContent: { padding: 16, paddingBottom: 40 }, listContentEmpty: { flex: 1 },
    card: { backgroundColor: THEME.bgCard, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: THEME.border },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    subject: { fontSize: 15, fontWeight: '700', color: THEME.textPrimary, flex: 1, marginRight: 8 }, date: { fontSize: 12, color: THEME.textSecondary },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { fontSize: 11, fontWeight: '600' },
    description: { fontSize: 13, color: THEME.textSecondary, lineHeight: 19, marginBottom: 12 },
    replyBox: { backgroundColor: THEME.successBg, borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: THEME.success },
    replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }, replyLabel: { fontSize: 12, fontWeight: '700', color: THEME.success },
    replyText: { fontSize: 13, color: THEME.textPrimary, lineHeight: 19 },
    noReplyBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10 },
    noReplyText: { fontSize: 12, color: THEME.textSecondary, fontStyle: 'italic' },
});

export default MyTicketsScreen;
