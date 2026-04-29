import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Alert,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            await login(email.trim(), password);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Something went wrong';
            Alert.alert('Login Failed', msg);
        }
    };

    return (
        <View style={styles.rootContainer}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* ── Top Branding Section ── */}
                    <View style={styles.brandingSection}>
                        {/* Decorative blobs */}
                        <View style={styles.blobTopRight} />
                        <View style={styles.blobTopLeft} />
                        <View style={styles.blobCenter} />

                        {/* Logo icon */}
                        <View style={styles.logoContainer}>
                            <MaterialCommunityIcons name="diamond-stone" size={38} color={THEME.gold} />
                        </View>

                        <Text style={styles.brandTitle}>Heritage Slabs</Text>
                        <Text style={styles.brandSubtitle}>Premium Granite Solutions</Text>
                    </View>

                    {/* ── Form Card Section ── */}
                    <View style={styles.formCardWrapper}>
                        <View style={styles.formCard}>
                            <Text style={styles.welcomeTitle}>Welcome Back</Text>
                            <Text style={styles.welcomeSubtitle}>Sign in to continue</Text>

                            {/* Email input with icon */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIconWrap}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color={THEME.textMuted} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Email Address"
                                    placeholderTextColor={THEME.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Password input with icon & toggle */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIconWrap}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color={THEME.textMuted} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
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
                                        size={20}
                                        color={THEME.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Sign In button */}
                            <TouchableOpacity style={styles.signInButton} onPress={handleLogin} activeOpacity={0.85}>
                                <Text style={styles.signInButtonText}>Sign In</Text>
                            </TouchableOpacity>

                            {/* OR divider */}
                            <View style={styles.orDivider}>
                                <View style={styles.orLine} />
                                <Text style={styles.orText}>OR</Text>
                                <View style={styles.orLine} />
                            </View>

                            {/* Sign Up link */}
                            <TouchableOpacity
                                style={styles.linkButton}
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={styles.linkText}>
                                    Don't have an account?{' '}
                                    <Text style={styles.linkHighlight}>Sign Up</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: THEME.bg,
    },

    brandingSection: {
        height: height * 0.25,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 0,
        overflow: 'visible',
    },
    blobTopRight: {
        position: 'absolute',
        top: -70,
        right: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(197,160,89,0.16)',
        zIndex: -1,
    },
    blobTopLeft: {
        position: 'absolute',
        top: -20,
        left: -80,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(37,45,49,0.14)',
        zIndex: -1,
    },
    blobCenter: {
        position: 'absolute',
        bottom: -50,
        right: width * 0.4,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(197,160,89,0.08)',
        zIndex: -1,
    },
    logoContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: 'rgba(197,160,89,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(197,160,89,0.2)',
    },
    brandTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: THEME.textPrimary,
        letterSpacing: 0.5,
    },
    brandSubtitle: {
        fontSize: 14,
        color: THEME.textSecondary,
        marginTop: 4,
        letterSpacing: 0.3,
    },


    formCardWrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    formCard: {
        backgroundColor: 'rgba(30,30,30,0.95)',
        borderRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 16,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: THEME.textPrimary,
        marginBottom: 2,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: THEME.textSecondary,
        marginBottom: 24,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        height: 48,
    },
    inputIconWrap: {
        width: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputField: {
        flex: 1,
        fontSize: 14,
        color: THEME.textPrimary,
        paddingVertical: 0,
        height: '100%',
    },
    eyeIcon: {
        width: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },


    signInButton: {
        backgroundColor: THEME.gold,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: THEME.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },


    orDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    orText: {
        color: THEME.textMuted,
        fontSize: 13,
        fontWeight: '600',
        marginHorizontal: 16,
        letterSpacing: 1,
    },


    linkButton: {
        alignItems: 'center',
    },
    linkText: {
        color: THEME.textSecondary,
        fontSize: 15,
        fontWeight: '500',
    },
    linkHighlight: {
        color: THEME.gold,
        fontWeight: '700',
    },
});

export default LoginScreen;