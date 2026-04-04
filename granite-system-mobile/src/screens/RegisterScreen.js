import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../theme';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Validation Error', 'Passwords do not match');
            return;
        }

        if (name.trim().length < 2) {
            Alert.alert('Validation Error', 'Name must be at least 2 characters');
            return;
        }

        if (/^\d+$/.test(name.trim())) {
            Alert.alert('Validation Error', 'Name cannot contain only numbers');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Validation Error', 'Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Validation Error', 'Password must be at least 8 characters long');
            return;
        }

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
            Alert.alert('Validation Error', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return;
        }

        try {
            const response = await api.post('/auth/register', { name, email, password });

            const token = response.data.token;
            const role = response.data.role || 'customer';
            const userId = response.data._id;

            if (!token) {
                Alert.alert('Account Created!', 'Please log in with your new credentials.');
                navigation.replace('Login');
                return;
            }

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRole', role);
            if (userId) {
                await AsyncStorage.setItem('userId', userId);
            }

            Alert.alert('Success!', `Welcome to the Granite Catalog, ${response.data.name}!`);
            navigation.replace('CustomerCatalog');

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Something went wrong';
            Alert.alert('Registration Failed', msg);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

            {/* Decorative blobs */}
            <View style={styles.blobTopRight} />
            <View style={styles.blobBottomLeft} />

            <View style={styles.formContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join to view premium granite slabs</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={THEME.textMuted}
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={THEME.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Password"
                        placeholderTextColor={THEME.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <MaterialCommunityIcons 
                            name={showPassword ? "eye-off-outline" : "eye-outline"} 
                            size={22} 
                            color={THEME.textMuted} 
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Confirm Password"
                        placeholderTextColor={THEME.textMuted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        <MaterialCommunityIcons 
                            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                            size={22} 
                            color={THEME.textMuted} 
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.linkText}>
                        Already have an account? <Text style={{ color: THEME.purple }}>Log In</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg, justifyContent: 'center' },
    blobTopRight: { position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: THEME.blobPurple },
    blobBottomLeft: { position: 'absolute', bottom: -80, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: THEME.blobIndigo },
    formContainer: { paddingHorizontal: 30 },
    title: { fontSize: 34, fontWeight: '800', color: THEME.textPrimary, marginBottom: 6, textAlign: 'center', letterSpacing: 0.5 },
    subtitle: { fontSize: 16, color: THEME.textSecondary, marginBottom: 40, textAlign: 'center' },
    input: { backgroundColor: THEME.bgInput, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: THEME.border, color: THEME.textPrimary },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.bgInput, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: THEME.border },
    passwordInput: { flex: 1, paddingVertical: 15, paddingHorizontal: 20, fontSize: 16, color: THEME.textPrimary },
    eyeIcon: { paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center' },
    button: { backgroundColor: THEME.purple, paddingVertical: 15, borderRadius: 12, marginTop: 10, alignItems: 'center', shadowColor: THEME.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkText: { color: THEME.textSecondary, fontSize: 15, fontWeight: '600' },
});

export default RegisterScreen;