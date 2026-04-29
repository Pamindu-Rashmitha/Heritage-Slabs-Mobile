import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import authService from '../api/authService';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(async () => {
        setLoading(true);
        try {
            const storedId = await AsyncStorage.getItem('userId');
            if (!storedId) { Alert.alert('Error', 'User ID not found. Please log in again.'); await logout(); return; }
            const storedRole = await AsyncStorage.getItem('userRole');
            setRole(storedRole || '');
            const response = await authService.getUserById(storedId);
            if (response.data) {
                setName(response.data.name || '');
                setEmail(response.data.email || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Could not load profile data.');
        } finally { setLoading(false); }
    }, [logout]);

    useFocusEffect(useCallback(() => { fetchUserProfile(); }, [fetchUserProfile]));

    const handleSignOut = () => {
        Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign out',
                onPress: async () => {
                    try {
                        await logout();
                    } catch (error) { console.error('Error logging out:', error); }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
                <ActivityIndicator size="large" color={THEME.gold} />
                <Text style={styles.loadingText}>Loading Profile...</Text>
            </SafeAreaView>
        );
    }

    const roleLabel = (role && String(role)) ? String(role).toUpperCase() : 'USER';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, styles.cardGap]}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                        </View>
                    </View>
                    <Text style={styles.displayName} numberOfLines={2}>{name || '—'}</Text>
                    <Text style={styles.displayEmail} numberOfLines={2}>{email || '—'}</Text>
                    <View style={styles.rolePill}>
                        <Text style={styles.rolePillText}>{roleLabel}</Text>
                    </View>
                </View>

                <View style={[styles.card, styles.cardGap]}>
                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => navigation.navigate('EditProfile')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.menuIconBox}>
                            <MaterialCommunityIcons name="account-edit-outline" size={22} color={THEME.gold} />
                        </View>
                        <Text style={styles.menuLabel}>Edit Profile</Text>
                        <MaterialCommunityIcons name="chevron-right" size={22} color={THEME.textMuted} />
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => navigation.navigate('HelpSupport')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.menuIconBox}>
                            <MaterialCommunityIcons name="help-circle-outline" size={22} color={THEME.gold} />
                        </View>
                        <Text style={styles.menuLabel}>Help & Support</Text>
                        <MaterialCommunityIcons name="chevron-right" size={22} color={THEME.textMuted} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={handleSignOut} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="logout" size={22} color={THEME.danger} style={styles.signOutIcon} />
                    <Text style={styles.deleteButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.bg },
    loadingText: { marginTop: 10, color: THEME.textSecondary, fontSize: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: THEME.border },
    headerTitle: { fontSize: 20, fontWeight: '800', color: THEME.textPrimary },
    backButton: { padding: 5 },
    formContainer: { padding: 20, paddingBottom: 40 },
    card: {
        backgroundColor: 'rgba(30,30,30,0.96)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 12,
    },
    cardGap: { marginBottom: 16 },
    avatarContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: THEME.gold, justifyContent: 'center', alignItems: 'center', shadowColor: THEME.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
    displayName: { fontSize: 20, fontWeight: '800', color: THEME.textPrimary, textAlign: 'center' },
    displayEmail: { fontSize: 15, color: THEME.textSecondary, textAlign: 'center', marginTop: 6 },
    rolePill: { alignSelf: 'center', marginTop: 16, backgroundColor: THEME.goldLight, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
    rolePillText: { fontSize: 12, fontWeight: '800', color: THEME.gold, letterSpacing: 0.5 },
    menuRow: { flexDirection: 'row', alignItems: 'center' },
    menuIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: THEME.goldLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: THEME.textPrimary },
    menuDivider: { height: 1, backgroundColor: THEME.divider, marginVertical: 14, marginLeft: 54 },
    deleteButton: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, borderWidth: 1.5, borderColor: THEME.danger, flexDirection: 'row', justifyContent: 'center' },
    deleteButtonText: { color: THEME.danger, fontSize: 16, fontWeight: '700' },
    signOutIcon: { marginRight: 8 },
});

export default ProfileScreen;
