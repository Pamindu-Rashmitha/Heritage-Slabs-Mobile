import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
    const [imageUris, setImageUris] = useState([]);
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

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) { Alert.alert('Permission Required', 'We need access to your photos to update a slab.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8
        });
        if (!result.canceled) {
            const selectedUris = result.assets.map(asset => asset.uri);
            setImageUris(selectedUris);
        }
    };

    const handleUpdateProduct = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            
            let payload;
            let headers = { Authorization: `Bearer ${token}` };

            if (imageUris.length > 0) {
                payload = new FormData();
                payload.append('stoneName', stoneName.trim());
                payload.append('stockInSqFt', Number(stock));
                payload.append('pricePerSqFt', Number(price));
                imageUris.forEach((uri) => {
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image`;
                    payload.append('images', { uri, name: filename, type: type });
                });
                headers['Content-Type'] = 'multipart/form-data';
            } else {
                payload = { stoneName: stoneName.trim(), stockInSqFt: Number(stock), pricePerSqFt: Number(price) };
            }

            await api.put(`/products/${product._id}`, payload, { headers });
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

    const currentImages = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.form}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={26} color={THEME.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Slab Details</Text>
                </View>

                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {imageUris.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageGrid}>
                            {imageUris.map((uri, idx) => <Image key={idx} source={{ uri }} style={styles.imagePreviewSmall} />)}
                        </ScrollView>
                    ) : currentImages.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageGrid}>
                            {currentImages.map((img, idx) => <Image key={idx} source={{ uri: getFullImageUrl(img) }} style={styles.imagePreviewSmall} />)}
                        </ScrollView>
                    ) : (
                        <View style={styles.imagePickerInner}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={32} color={THEME.textMuted} />
                            <Text style={styles.imagePickerText}>Tap to Replace Photos</Text>
                        </View>
                    )}
                </TouchableOpacity>

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

import * as ImagePicker from 'expo-image-picker';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    form: { padding: 25 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, gap: 12 },
    backButton: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 8 },
    title: { fontSize: 24, fontWeight: '800', color: THEME.textPrimary },
    imagePicker: { height: 180, backgroundColor: THEME.bgCard, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border },
    imagePickerInner: { alignItems: 'center', gap: 8 },
    imageGrid: { flexDirection: 'row', paddingHorizontal: 10, alignItems: 'center' },
    imagePreviewSmall: { width: 140, height: 140, borderRadius: 10, marginRight: 10 },
    imagePickerText: { color: THEME.textMuted, fontSize: 14, fontWeight: '600' },
    label: { fontSize: 14, color: THEME.textSecondary, marginBottom: 5, fontWeight: '600', marginLeft: 5 },
    input: { backgroundColor: THEME.bgInput, padding: 15, borderRadius: 12, marginBottom: 5, fontSize: 16, borderWidth: 1, borderColor: THEME.border, color: THEME.textPrimary },
    inputError: { borderColor: THEME.danger, borderWidth: 1.5 },
    errorText: { color: THEME.danger, fontSize: 12, marginBottom: 10, marginLeft: 5 },
    updateButton: { backgroundColor: THEME.indigo, padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center', shadowColor: THEME.indigo, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default EditProductScreen;
