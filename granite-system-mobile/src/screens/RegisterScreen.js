import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    StatusBar,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        let newErrors = {};

        if (!name) newErrors.name = 'Full Name is required';
        else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
        else if (/^\d+$/.test(name.trim())) newErrors.name = 'Name cannot contain only numbers';

        if (!email) newErrors.email = 'Email Address is required';
        else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) newErrors.email = 'Please enter a valid email address';
        }

        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters long';
        else {
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasNumber = /\d/.test(password);
            const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
            if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
                newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
            }
        }

        if (!confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
        else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        try {
            const response = await register({ name, email, password });

            if (!response.token) {
                Alert.alert('Account Created!', 'Please log in with your new credentials.');
                navigation.navigate('Login');
                return;
            }

            Alert.alert('Success!', `Welcome to the Granite Catalog, ${response.name}!`);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Something went wrong';
            Alert.alert('Registration Failed', msg);
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
                            <Text style={styles.welcomeTitle}>Create Account</Text>
                            <Text style={styles.welcomeSubtitle}>Join to view premium granite slabs</Text>

                            {/* Full Name input */}
                            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                                <View style={styles.inputIconWrap}>
                                    <MaterialCommunityIcons name="account-outline" size={20} color={errors.name ? '#FF4C4C' : THEME.textMuted} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Full Name"
                                    placeholderTextColor={THEME.textMuted}
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (errors.name) setErrors({...errors, name: null});
                                    }}
                                />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                            {/* Email input */}
                            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                <View style={styles.inputIconWrap}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color={errors.email ? '#FF4C4C' : THEME.textMuted} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Email Address"
                                    placeholderTextColor={THEME.textMuted}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (errors.email) setErrors({...errors, email: null});
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                            {/* Password input */}
                            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                                <View style={styles.inputIconWrap}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color={errors.password ? '#FF4C4C' : THEME.textMuted} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Password"
                                    placeholderTextColor={THEME.textMuted}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({...errors, password: null});
                                    }}
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
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                            {/* Confirm Password input */}
                            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                                <View style={styles.inputIconWrap}>
                                    <MaterialCommunityIcons name="lock-check-outline" size={20} color={errors.confirmPassword ? '#FF4C4C' : THEME.textMuted} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Confirm Password"
                                    placeholderTextColor={THEME.textMuted}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) setErrors({...errors, confirmPassword: null});
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <MaterialCommunityIcons
                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={THEME.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                            {/* Sign Up button */}
                            <TouchableOpacity style={styles.signUpButton} onPress={handleRegister} activeOpacity={0.85}>
                                <Text style={styles.signUpButtonText}>Sign Up</Text>
                            </TouchableOpacity>

                            {/* OR divider */}
                            <View style={styles.orDivider}>
                                <View style={styles.orLine} />
                                <Text style={styles.orText}>OR</Text>
                                <View style={styles.orLine} />
                            </View>

                            {/* Login link */}
                            <TouchableOpacity
                                style={styles.linkButton}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.linkText}>
                                    Already have an account?{' '}
                                    <Text style={styles.linkHighlight}>Log In</Text>
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

    /* ── Branding Section ── */
    brandingSection: {
        height: height * 0.24,
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
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: 'rgba(197,160,89,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(197,160,89,0.2)',
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: THEME.textPrimary,
        letterSpacing: 0.5,
    },
    brandSubtitle: {
        fontSize: 13,
        color: THEME.textSecondary,
        marginTop: 2,
        letterSpacing: 0.3,
    },

    /* ── Form Card ── */
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
        marginBottom: 20,
    },

    /* ── Input Fields ── */
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 10,
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
    inputError: {
        borderColor: '#FF4C4C',
        backgroundColor: 'rgba(255,76,76,0.05)',
    },
    errorText: {
        color: '#FF4C4C',
        fontSize: 12,
        marginTop: -6,
        marginBottom: 10,
        marginLeft: 4,
    },

    /* ── Sign Up Button ── */
    signUpButton: {
        backgroundColor: THEME.gold,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        shadowColor: THEME.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    signUpButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    /* ── OR Divider ── */
    orDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
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

    /* ── Link ── */
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

export default RegisterScreen;