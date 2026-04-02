import React, { useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axiosConfig';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '../theme';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Validation Error', 'Please enter a valid email address');
            return;
        }

        try {
            const response = await api.post('/auth/login', {
                email: email,
                password: password,
            });

            const token = response.data.token;
            const role = response.data.role;
            const userId = response.data._id;

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRole', role);
            if (userId) {
                await AsyncStorage.setItem('userId', userId);
            }

            if (role === 'Admin') {
                navigation.replace('AdminDashboard');
            } else {
                navigation.replace('CustomerCatalog');
            }

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Something went wrong';
            Alert.alert('Login Failed', msg);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

            {/* Decorative blurred blobs */}
            <View style={styles.blobTopRight} />
            <View style={styles.blobBottomLeft} />

            <View style={styles.formContainer}>
                <Text style={styles.title}>Heritage Slabs</Text>
                <Text style={styles.subtitle}>ERP for granites</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={THEME.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={THEME.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{ marginTop: 20, alignItems: 'center' }}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.linkText}>
                        Don't have an account? <Text style={{ color: THEME.indigo }}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.bg,
        justifyContent: 'center',
    },
    blobTopRight: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: THEME.blobIndigo,
    },
    blobBottomLeft: {
        position: 'absolute',
        bottom: -80,
        left: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: THEME.blobPurple,
    },
    formContainer: {
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: THEME.textPrimary,
        marginBottom: 6,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.textSecondary,
        marginBottom: 40,
        textAlign: 'center',
    },
    input: {
        backgroundColor: THEME.bgInput,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: THEME.border,
        color: THEME.textPrimary,
    },
    button: {
        backgroundColor: THEME.indigo,
        paddingVertical: 15,
        borderRadius: 12,
        marginTop: 10,
        alignItems: 'center',
        shadowColor: THEME.indigo,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    linkText: {
        color: THEME.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});

export default LoginScreen;