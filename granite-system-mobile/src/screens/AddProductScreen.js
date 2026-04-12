import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Image, 
    Alert, ActivityIndicator, ScrollView, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import productService from '../api/productService';
import { THEME } from '../theme';

const AddProductScreen = ({ navigation }) => {
    const [stoneName, setStoneName] = useState('');
    const [stock, setStock] = useState('');
    const [price, setPrice] = useState('');
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
        if (imageUris.length === 0) { newErrors.image = 'Please select at least one product image'; }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) { Alert.alert('Permission Required', 'We need access to your photos to upload a slab.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8
        });
        if (!result.canceled) {
            const selectedUris = result.assets.map(asset => asset.uri);
            setImageUris(selectedUris);
            setErrors(prev => ({ ...prev, image: undefined }));
        }
    };

    const handleAddProduct = async () => {
        if (!validate()) return;
        setLoading(true);
        try {

            const formData = new FormData();
            formData.append('stoneName', stoneName.trim());
            formData.append('stockInSqFt', stock);
            formData.append('pricePerSqFt', price);

            imageUris.forEach((uri, index) => {
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                formData.append('images', { uri, name: filename, type: type });
            });

            await productService.create(formData);
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
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Add New Slab</Text>
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                        {imageUris.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageGrid}>
                                {imageUris.map((uri, index) => (
                                    <Image key={index} source={{ uri }} style={styles.imagePreviewSmall} />
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={styles.imagePickerInner}>
                                <View style={styles.camBadge}>
                                    <MaterialCommunityIcons name="camera-plus" size={24} color={THEME.gold} />
                                </View>
                                <Text style={styles.imagePickerText}>Tap to Select Photos (Max 5)</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Stone Name</Text>
                        <TextInput 
                            style={[styles.input, errors.stoneName && styles.inputError]} 
                            placeholder="e.g., Black Galaxy" 
                            placeholderTextColor={THEME.textMuted} 
                            value={stoneName}
                            onChangeText={(text) => { setStoneName(text); setErrors(prev => ({ ...prev, stoneName: undefined })); }} 
                        />
                        {errors.stoneName && <Text style={styles.errorText}>{errors.stoneName}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Stock In SqFt</Text>
                        <TextInput 
                            style={[styles.input, errors.stock && styles.inputError]} 
                            placeholder="e.g., 500" 
                            placeholderTextColor={THEME.textMuted} 
                            value={stock}
                            onChangeText={(text) => { setStock(text); setErrors(prev => ({ ...prev, stock: undefined })); }} 
                            keyboardType="numeric" 
                        />
                        {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Price Per SqFt</Text>
                        <TextInput 
                            style={[styles.input, errors.price && styles.inputError]} 
                            placeholder="e.g., 2500" 
                            placeholderTextColor={THEME.textMuted} 
                            value={price}
                            onChangeText={(text) => { setPrice(text); setErrors(prev => ({ ...prev, price: undefined })); }} 
                            keyboardType="numeric" 
                        />
                        {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                    </View>

                    <TouchableOpacity style={styles.uploadButton} onPress={handleAddProduct} disabled={loading} activeOpacity={0.9}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload Product</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};



const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.bg },
    container: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
        backgroundColor: THEME.bg
    },
    backButton: { 
        backgroundColor: 'rgba(255,255,255,0.06)', 
        borderRadius: 10, 
        padding: 8,
        marginRight: 15
    },
    title: { fontSize: 20, fontWeight: '800', color: THEME.textPrimary },
    form: { padding: 20 },
    imagePicker: { 
        height: 180, 
        backgroundColor: THEME.bgCard, 
        borderRadius: 16, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20, 
        overflow: 'hidden', 
        borderWidth: 1, 
        borderColor: THEME.border,
        borderStyle: 'dashed'
    },
    imagePickerInner: { alignItems: 'center', gap: 10 },
    camBadge: {
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        padding: 12,
        borderRadius: 20,
    },
    imageGrid: { flexDirection: 'row', paddingHorizontal: 10, alignItems: 'center' },
    imagePreviewSmall: { width: 140, height: 140, borderRadius: 12, marginRight: 12 },
    imagePickerText: { color: THEME.textMuted, fontSize: 14, fontWeight: '600' },
    
    inputGroup: { marginBottom: 20 },
    label: { 
        fontSize: 14, 
        color: THEME.textSecondary, 
        marginBottom: 8, 
        fontWeight: '600', 
        marginLeft: 4 
    },
    input: { 
        backgroundColor: THEME.bgInput, 
        padding: 16, 
        borderRadius: 14, 
        fontSize: 16, 
        borderWidth: 1, 
        borderColor: THEME.border, 
        color: THEME.textPrimary 
    },
    inputError: { borderColor: THEME.danger, borderWidth: 1.5 },
    errorText: { color: THEME.danger, fontSize: 12, marginTop: 5, marginLeft: 5 },
    
    uploadButton: { 
        backgroundColor: THEME.gold, 
        padding: 16, 
        borderRadius: 14, 
        marginTop: 10, 
        alignItems: 'center', 
        shadowColor: THEME.gold, 
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.4, 
        shadowRadius: 12, 
        elevation: 8 
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
});

export default AddProductScreen;
