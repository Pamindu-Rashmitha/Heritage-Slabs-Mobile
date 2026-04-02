import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';
import { THEME } from '../theme';

const AddProductScreen = ({ navigation }) => {
    const [stoneName, setStoneName] = useState('');
    const [stock, setStock] = useState('');
    const [price, setPrice] = useState('');
    const [imageUri, setImageUri] = useState(null);
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
        if (!imageUri) { newErrors.image = 'Please select a product image'; }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) { Alert.alert('Permission Required', 'We need access to your photos to upload a slab.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
        if (!result.canceled) { setImageUri(result.assets[0].uri); setErrors(prev => ({ ...prev, image: undefined })); }
    };

    const handleAddProduct = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('stoneName', stoneName.trim());
            formData.append('stockInSqFt', stock);
            formData.append('pricePerSqFt', price);
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;
            formData.append('image', { uri: imageUri, name: filename, type: type });
            await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
            Alert.alert('Success!', 'New Granite Slab added to inventory.');
            navigation.goBack();
        } catch (error) {
            console.error('Upload Error:', error);
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (data.errors && data.errors.length > 0) { Alert.alert('Validation Error', data.errors[0].msg); }
                else if (data.message) { Alert.alert('Error', data.message); }
                else { Alert.alert('Upload Failed', 'Please check your input and try again.'); }
            } else { Alert.alert('Upload Failed', 'Make sure your backend is running and the route is correct.'); }
        } finally { setLoading(false); }
    };

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.form}>
                <Text style={styles.title}>Add New Slab</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    ) : (
                        <View style={styles.imagePickerInner}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={32} color={THEME.textMuted} />
                            <Text style={styles.imagePickerText}>Tap to Select Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>
                {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}

                <TextInput style={[styles.input, errors.stoneName && styles.inputError]} placeholder="Stone Name (e.g., Black Galaxy)" placeholderTextColor={THEME.textMuted} value={stoneName}
                    onChangeText={(text) => { setStoneName(text); setErrors(prev => ({ ...prev, stoneName: undefined })); }} />
                {errors.stoneName && <Text style={styles.errorText}>{errors.stoneName}</Text>}

                <TextInput style={[styles.input, errors.stock && styles.inputError]} placeholder="Stock in SqFt (e.g., 500)" placeholderTextColor={THEME.textMuted} value={stock}
                    onChangeText={(text) => { setStock(text); setErrors(prev => ({ ...prev, stock: undefined })); }} keyboardType="numeric" />
                {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}

                <TextInput style={[styles.input, errors.price && styles.inputError]} placeholder="Price per SqFt (e.g., 1200)" placeholderTextColor={THEME.textMuted} value={price}
                    onChangeText={(text) => { setPrice(text); setErrors(prev => ({ ...prev, price: undefined })); }} keyboardType="numeric" />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

                <TouchableOpacity style={styles.uploadButton} onPress={handleAddProduct} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload Product</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

import { MaterialCommunityIcons } from '@expo/vector-icons';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    form: { padding: 30 },
    title: { fontSize: 28, fontWeight: '800', color: THEME.textPrimary, marginBottom: 20 },
    imagePicker: { height: 200, backgroundColor: THEME.bgCard, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 5, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border },
    imagePickerInner: { alignItems: 'center', gap: 8 },
    imagePreview: { width: '100%', height: '100%' },
    imagePickerText: { color: THEME.textMuted, fontSize: 15, fontWeight: '600' },
    input: { backgroundColor: THEME.bgInput, padding: 15, borderRadius: 12, marginBottom: 5, fontSize: 16, borderWidth: 1, borderColor: THEME.border, color: THEME.textPrimary },
    inputError: { borderColor: THEME.danger, borderWidth: 1.5 },
    errorText: { color: THEME.danger, fontSize: 12, marginBottom: 10, marginLeft: 5 },
    uploadButton: { backgroundColor: THEME.indigo, padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center', shadowColor: THEME.indigo, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default AddProductScreen;
