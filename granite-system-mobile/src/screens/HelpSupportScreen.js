import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../theme';

const sections = [
    {
        title: 'Browse the catalogue',
        body: 'Open the Catalog tab to see available granite slabs. Use the search bar to find a stone by name, tap a product to see photos and details, and choose a quantity (respecting in-stock area) before adding to your cart.',
    },
    {
        title: 'Cart and checkout',
        body: 'Use the bottom navigation to open Cart. Review items, change quantities, or remove products. When you are ready, enter your delivery address, phone, city, preferred date, and payment details to place an order. Delivery and optional fees are shown before you confirm.',
    },
    {
        title: 'Orders',
        body: 'Open Orders from the bottom bar to see your order history and track the status of requests you have placed.',
    },
    {
        title: 'My Tickets',
        body: 'Use My Tickets to view support conversations and follow up. You can submit new requests from the ticket flow when you need help with an order or product.',
    },
    {
        title: 'Profile and account',
        body: 'From Profile you can see your account summary, open Edit profile to change your name, email, or password, and sign out when you are finished. Account deletion is available from the edit screen if you need to close your account.',
    },
];

const HelpSupportScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introCard}>
                    <MaterialCommunityIcons name="lifebuoy" size={40} color={THEME.gold} />
                    <Text style={styles.introTitle}>How to use the app</Text>
                    <Text style={styles.introBody}>
                        Heritage Slabs lets you explore inventory, build a cart, place orders, and get help when you need it. Here is a quick guide to the main areas.
                    </Text>
                </View>
                {sections.map((s) => (
                    <View key={s.title} style={styles.card}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialCommunityIcons name="book-open-page-variant" size={20} color={THEME.gold} />
                            <Text style={styles.sectionTitleText}>{s.title}</Text>
                        </View>
                        <Text style={styles.sectionBody}>{s.body}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: THEME.border },
    headerTitle: { fontSize: 20, fontWeight: '800', color: THEME.textPrimary },
    backButton: { padding: 5 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    introCard: {
        backgroundColor: 'rgba(30,30,30,0.96)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 22,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 12,
    },
    introTitle: { fontSize: 20, fontWeight: '800', color: THEME.textPrimary, marginTop: 12, textAlign: 'center' },
    introBody: { fontSize: 15, lineHeight: 22, color: THEME.textSecondary, marginTop: 10, textAlign: 'center' },
    card: {
        backgroundColor: 'rgba(30,30,30,0.96)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 22,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 12,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sectionTitleText: { fontSize: 17, fontWeight: '700', color: THEME.textPrimary, flex: 1, marginLeft: 8 },
    sectionBody: { fontSize: 15, lineHeight: 22, color: THEME.textSecondary },
});

export default HelpSupportScreen;
