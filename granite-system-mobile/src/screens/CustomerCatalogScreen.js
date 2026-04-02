import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator, Alert,
    TouchableOpacity, Image, StatusBar, Dimensions, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axiosConfig';
import { THEME } from '../theme';

const addToCart = async (product) => {
    try {
        const cartData = await AsyncStorage.getItem('cart');
        let cart = cartData ? JSON.parse(cartData) : [];
        const exists = cart.find(i => i._id === product._id);
        if (exists) {
            cart = cart.map(i => i._id === product._id ? { ...i, qty: (i.qty || 1) + 1 } : i);
            Alert.alert('Updated!', `${product.stoneName} quantity increased in cart.`);
        } else {
            cart.push({ ...product, qty: 1 });
            Alert.alert('Added to Cart! 🛒', `${product.stoneName} has been added to your cart.`);
        }
        await AsyncStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
        Alert.alert('Error', 'Could not add to cart.');
    }
};
const SERVER_URL = 'http://192.168.1.8:5000';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NavItem = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const BottomNavBar = ({ onLogout, onNavigateProfile, onNavigateCart, onNavigateOrders, onNavigateSupport }) => (
    <View style={styles.bottomNav}>
        <NavItem icon="account-outline" label="Profile" color={THEME.navInactive} onPress={onNavigateProfile} />
        <NavItem icon="cart-outline" label="Cart" color={THEME.navInactive} onPress={onNavigateCart} />
        <NavItem icon="history" label="Orders" color={THEME.navInactive} onPress={onNavigateOrders} />
        <NavItem icon="message-outline" label="My Tickets" color={THEME.navInactive} onPress={onNavigateSupport} />
        <NavItem icon="logout" label="Logout" color={THEME.danger} onPress={onLogout} />
    </View>
);

const SlabCard = ({ item, onAddToCart }) => {
    const finalImageUrl = item.imageUrl
        ? `${SERVER_URL}${item.imageUrl}`
        : 'https://via.placeholder.com/800x600?text=No+Image';

    return (
        <View style={styles.card}>
            <Image source={{ uri: finalImageUrl }} style={styles.slabImage} resizeMode="cover" />
            <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>Granite Slab</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.stoneName} numberOfLines={1}>{item.stoneName}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="layers-outline" size={13} color={THEME.textSecondary} />
                        <Text style={styles.metaChipText}>{item.stockInSqFt} SqFt</Text>
                    </View>
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>LKR {item.pricePerSqFt}<Text style={styles.priceSub}>/SqFt</Text></Text>
                    </View>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.addCartBtn} onPress={() => onAddToCart(item)} activeOpacity={0.85}>
                        <MaterialCommunityIcons name="cart-plus" size={16} color="#fff" />
                        <Text style={styles.addCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const CatalogHeader = ({ isSearchActive, setIsSearchActive, searchQuery, setSearchQuery }) => (
    <View style={styles.header}>
        {isSearchActive ? (
            <TextInput
                style={styles.searchInput}
                placeholder="Search slabs..."
                placeholderTextColor={THEME.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
            />
        ) : (
            <View>
                <Text style={styles.headerEyebrow}>HERITAGE SLABS</Text>
                <Text style={styles.headerTitle}>Stone Catalogue</Text>
            </View>
        )}
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8}
            onPress={() => {
                if (isSearchActive) { setSearchQuery(''); setIsSearchActive(false); }
                else { setIsSearchActive(true); }
            }}>
            <MaterialCommunityIcons name={isSearchActive ? "close" : "magnify"} size={22} color={THEME.textPrimary} />
        </TouchableOpacity>
    </View>
);

const CustomerCatalogScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);

    useEffect(() => { fetchInventory(); }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            navigation.replace('Login');
        } catch (error) { console.error('Error logging out:', error); }
    };

    const fetchInventory = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const response = await api.get('/products');
            const data = response.data.products ?? response.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Network/Backend Error:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to fetch inventory from the server.');
        } finally { setLoading(false); setRefreshing(false); }
    };

    const filteredProducts = products.filter((product) =>
        product.stoneName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
                <CatalogHeader isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={THEME.indigo} />
                    <Text style={styles.loadingText}>Loading Catalogue…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.blobTopRight} />

            <CatalogHeader isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <SlabCard item={item} onAddToCart={addToCart} />}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={() => fetchInventory(true)}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <MaterialCommunityIcons name="package-variant" size={64} color={THEME.textMuted} />
                        <Text style={styles.emptyText}>No slabs available yet.</Text>
                    </View>
                }
            />

            <BottomNavBar
                onLogout={handleLogout}
                onNavigateProfile={() => navigation.navigate('Profile')}
                onNavigateCart={() => navigation.navigate('Cart')}
                onNavigateOrders={() => navigation.navigate('MyOrders')}
                onNavigateSupport={() => navigation.navigate('MyTickets')}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    blobTopRight: { position: 'absolute', top: -40, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: THEME.blobPurple },

    header: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: THEME.border,
    },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.indigo, letterSpacing: 2, marginBottom: 2 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: THEME.textPrimary },
    searchBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 },
    searchInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, color: THEME.textPrimary, fontSize: 16, marginRight: 10, borderWidth: 1, borderColor: THEME.border },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: THEME.textSecondary, fontSize: 14 },
    emptyText: { marginTop: 12, color: THEME.textSecondary, fontSize: 15 },

    listContent: { padding: 16, paddingBottom: 20 },

    card: {
        backgroundColor: THEME.bgCard,
        borderRadius: 18, marginBottom: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: THEME.border,
    },
    slabImage: { width: '100%', height: 200, backgroundColor: 'rgba(255,255,255,0.04)' },
    categoryTag: { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(15,15,30,0.75)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
    categoryTagText: { color: THEME.textPrimary, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    cardContent: { padding: 16 },
    stoneName: { fontSize: 20, fontWeight: '800', color: THEME.textPrimary, marginBottom: 10 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    metaChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, gap: 4 },
    metaChipText: { fontSize: 13, color: THEME.textSecondary, fontWeight: '500' },
    priceBadge: { backgroundColor: THEME.indigoLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    priceText: { fontSize: 15, fontWeight: '800', color: THEME.indigo },
    priceSub: { fontSize: 12, fontWeight: '500', color: THEME.indigo },

    cardActions: { flexDirection: 'row', gap: 10 },
    addCartBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: THEME.indigo, borderRadius: 10, paddingVertical: 11, shadowColor: THEME.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    addCartText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    bottomNav: {
        flexDirection: 'row', backgroundColor: THEME.navBg,
        paddingVertical: 10, paddingHorizontal: 10,
        borderTopWidth: 1, borderTopColor: THEME.border,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
    navLabel: { fontSize: 11, fontWeight: '600' },
});

export default CustomerCatalogScreen;