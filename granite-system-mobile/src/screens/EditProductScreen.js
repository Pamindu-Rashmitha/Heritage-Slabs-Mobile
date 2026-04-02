import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';
import { THEME } from '../theme';

const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const serverUrl = api.defaults.baseURL.replace(/\/api$/, '');
    const formattedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${serverUrl}${formattedPath}`;
};

const EditProductScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const [stoneName, setStoneName] = useState(product.stoneName);
    const [stock, setStock] = useState(product.stockInSqFt.toString());
    const [price, setPrice] = useState(product.pricePerSqFt.toString());
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        const trimmedName = stoneName.trim();
        if (!trimmedName) { newErrors.stoneName = 'Stone Name is required'; }
        else if (trimmedName.length < 5) { newErrors.stoneName = 'Stone name must be at least 5 characters'; }
        else if (trimmedName.length > 20) { newErrors.stoneName = 'Stone name cannot exceed 20 characters'; }
        else if (!/^[A-Za-z\s\-]+$/.test(trimmedName)) { newErrors.stoneName = 'Stone name can only contain letters, spaces, and hyphens'; }
        const priceNum = parseFloat(price);
        if (!price) { newErrors.price = 'Price per square foot is required'; }
        else if (isNaN(priceNum) || priceNum <= 0) { newErrors.price = 'Price must be greater than 0'; }
        else if (priceNum > 6000) { newErrors.price = 'Price cannot exceed 6,000'; }
        const stockNum = parseFloat(stock);
        if (!stock) { newErrors.stock = 'Stock in square feet is required'; }
        else if (isNaN(stockNum) || stockNum < 0) { newErrors.stock = 'Stock must be a non-negative value'; }
        else if (stockNum > 1000000) { newErrors.stock = 'Stock cannot exceed 1,000,000'; }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateProduct = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const updatedData = { stoneName: stoneName.trim(), stockInSqFt: Number(stock), pricePerSqFt: Number(price) };
            await api.put(`/products/${product._id}`, updatedData, { headers: { Authorization: `Bearer ${token}` } });
            Alert.alert('Success!', 'Slab details updated successfully.');
            navigation.goBack();
        } catch (error) {
            console.error('Update Error:', error);
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (data.errors && data.errors.length > 0) { Alert.alert('Validation Error', data.errors[0].msg); }
                else if (data.message) { Alert.alert('Error', data.message); }
                else { Alert.alert('Update Failed', 'Please check your input and try again.'); }
            } else { Alert.alert('Update Failed', 'Make sure your backend is running and the route is correct.'); }
        } finally { setLoading(false); }
    };

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.form}>
                <Text style={styles.title}>Edit Slab Details</Text>
                {product.imageUrl && (
                    <View style={styles.imagePicker}>
                        <Image source={{ uri: getFullImageUrl(product.imageUrl) }} style={styles.imagePreview} />
                    </View>
                )}
                <Text style={styles.label}>Stone Name</Text>
                <TextInput style={[styles.input, errors.stoneName && styles.inputError]} placeholder="Stone Name" placeholderTextColor={THEME.textMuted} value={stoneName}
                    onChangeText={(text) => { setStoneName(text); setErrors(prev => ({ ...prev, stoneName: undefined })); }} />
                {errors.stoneName && <Text style={styles.errorText}>{errors.stoneName}</Text>}

                <Text style={styles.label}>Stock in SqFt</Text>
                <TextInput style={[styles.input, errors.stock && styles.inputError]} placeholder="Stock in SqFt" placeholderTextColor={THEME.textMuted} value={stock}
                    onChangeText={(text) => { setStock(text); setErrors(prev => ({ ...prev, stock: undefined })); }} keyboardType="numeric" />
                {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}

                <Text style={styles.label}>Price per SqFt</Text>
                <TextInput style={[styles.input, errors.price && styles.inputError]} placeholder="Price per SqFt" placeholderTextColor={THEME.textMuted} value={price}
                    onChangeText={(text) => { setPrice(text); setErrors(prev => ({ ...prev, price: undefined })); }} keyboardType="numeric" />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

                <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProduct} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    form: { padding: 30 },
    title: { fontSize: 28, fontWeight: '800', color: THEME.textPrimary, marginBottom: 20 },
    imagePicker: { height: 200, backgroundColor: THEME.bgCard, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border },
    imagePreview: { width: '100%', height: '100%' },
    label: { fontSize: 14, color: THEME.textSecondary, marginBottom: 5, fontWeight: '600', marginLeft: 5 },
    input: { backgroundColor: THEME.bgInput, padding: 15, borderRadius: 12, marginBottom: 5, fontSize: 16, borderWidth: 1, borderColor: THEME.border, color: THEME.textPrimary },
    inputError: { borderColor: THEME.danger, borderWidth: 1.5 },
    errorText: { color: THEME.danger, fontSize: 12, marginBottom: 10, marginLeft: 5 },
    updateButton: { backgroundColor: THEME.indigo, padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center', shadowColor: THEME.indigo, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default EditProductScreen;
