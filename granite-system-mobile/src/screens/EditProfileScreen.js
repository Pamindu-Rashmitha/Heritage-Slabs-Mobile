import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import authService from '../api/authService';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';

const EditProfileScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => { fetchUserProfile(); }, []);

    const fetchUserProfile = async () => {
        try {
            const storedId = await AsyncStorage.getItem('userId');
            if (!storedId) { Alert.alert('Error', 'User ID not found. Please log in again.'); await logout(); return; }
            setUserId(storedId);
            const response = await authService.getUserById(storedId);
            if (response.data) { setName(response.data.name || ''); setEmail(response.data.email || ''); }
        } catch (error) { console.error('Error fetching profile:', error); Alert.alert('Error', 'Could not load profile data.'); }
        finally { setLoading(false); }
    };

    const handleUpdateProfile = async () => {
        if (!name || !email) { Alert.alert('Validation Error', 'Name and email cannot be empty'); return; }
        setSaving(true);
        try {
            const payload = { name, email };
            if (password) { payload.password = password; }
            const response = await authService.updateUser(userId, payload);
            if (response.status === 200) { Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]); }
        } catch (error) { console.error('Update error:', error); Alert.alert('Error', error.response?.data?.message || 'Failed to update profile'); }
        finally { setSaving(false); }
    };

    const handleDeleteAccount = () => {
        Alert.alert('Delete Account', 'Are you sure you want to permanently delete your account? This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                    setSaving(true);
                    await authService.deleteUser(userId);
                    Alert.alert('Account Deleted', 'Your account has been deleted successfully.', [
                        { text: 'OK', onPress: () => logout() },
                    ]);
                } catch (error) { console.error('Delete error:', error); Alert.alert('Error', error.response?.data?.message || 'Failed to delete account.'); setSaving(false); }
            }},
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit profile</Text>
                <View style={{ width: 24 }} />
            </View>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
                <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                            </View>
                        </View>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput style={styles.input} placeholder="Your Name" placeholderTextColor={THEME.textMuted} value={name} onChangeText={setName} />
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={THEME.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <Text style={styles.label}>New Password (Optional)</Text>
                        <TextInput style={styles.input} placeholder="Leave blank to keep current password" placeholderTextColor={THEME.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
                        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateButtonText}>Save Changes</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} disabled={saving}>
                            <Text style={styles.deleteButtonText}>Delete My Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
    avatarContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: THEME.gold, justifyContent: 'center', alignItems: 'center', shadowColor: THEME.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
    label: { fontSize: 14, fontWeight: '600', color: THEME.textSecondary, marginBottom: 5, marginLeft: 5 },
    input: { backgroundColor: THEME.bgInput, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: THEME.border, color: THEME.textPrimary },
    updateButton: { backgroundColor: THEME.gold, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: THEME.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    updateButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    deleteButton: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, borderWidth: 1.5, borderColor: THEME.danger },
    deleteButtonText: { color: THEME.danger, fontSize: 16, fontWeight: '700' },
});

export default EditProfileScreen;
