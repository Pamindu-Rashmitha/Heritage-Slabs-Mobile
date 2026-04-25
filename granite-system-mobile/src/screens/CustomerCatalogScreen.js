import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator, Alert,
    TouchableOpacity, Image, StatusBar, Dimensions, TextInput, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';
import productService from '../api/productService';
import { THEME } from '../theme';

const getUserCartKey = async () => {
    const userId = await AsyncStorage.getItem('userId');
    return userId ? `cart_${userId}` : 'cart';
};

const addToCart = async (product, qty = 1) => {
    try {
        const cartKey = await getUserCartKey();
        const cartData = await AsyncStorage.getItem(cartKey);
        let cart = cartData ? JSON.parse(cartData) : [];
        const exists = cart.find(i => i._id === product._id);
        if (exists) {
            cart = cart.map(i => i._id === product._id ? { ...i, qty: (i.qty || 1) + qty } : i);
            Alert.alert('Updated!', `${product.stoneName} quantity increased in cart.`);
        } else {
            cart.push({ ...product, qty });
            Alert.alert('Added to Cart! 🛒', `${product.stoneName} has been added to your cart.`);
        }
        await AsyncStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (e) {
        Alert.alert('Error', 'Could not add to cart.');
    }
};
const getServerUrl = () => api.defaults.baseURL.replace(/\/api$/, '');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CATALOG_CARD_IMAGE_WIDTH = SCREEN_WIDTH - 32;

const NavItem = ({ icon, label, color, onPress, badge }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
        <View>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
            {badge > 0 && (
                <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
            )}
        </View>
        <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const BottomNavBar = ({ onLogout, onNavigateCatalog, onNavigateCart, onNavigateOrders, onNavigateSupport, cartCount, cartTotal }) => (
    <View style={styles.bottomNav}>
        <NavItem icon="home-outline" label="Catalog" color={THEME.gold} onPress={onNavigateCatalog} />
        <TouchableOpacity style={styles.navItem} onPress={onNavigateCart} activeOpacity={0.7}>
            <View>
                <MaterialCommunityIcons name="cart-outline" size={24} color={cartCount > 0 ? THEME.gold : THEME.navInactive} />
                {cartCount > 0 && (
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                    </View>
                )}
            </View>
            {cartCount > 0 ? (
                <Text style={[styles.navLabel, { color: THEME.gold, fontWeight: '700' }]}>LKR {cartTotal.toLocaleString()}</Text>
            ) : (
                <Text style={[styles.navLabel, { color: THEME.navInactive }]}>Cart</Text>
            )}
        </TouchableOpacity>
        <NavItem icon="history" label="Orders" color={THEME.navInactive} onPress={onNavigateOrders} />
        <NavItem icon="message-outline" label="My Tickets" color={THEME.navInactive} onPress={onNavigateSupport} />
        <NavItem icon="logout" label="Logout" color={THEME.danger} onPress={onLogout} />
    </View>
);

const buildImageUri = (path, serverUrl) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const SlabCard = ({ item, onAddToCart, onPress }) => {
    const [qty, setQty] = useState(1);
    const [cardImageIndex, setCardImageIndex] = useState(0);
    const images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
    const serverUrl = getServerUrl();
    const finalImageUrl = images.length > 0
        ? (images[0].startsWith('http') ? images[0] : `${serverUrl}${images[0].startsWith('/') ? '' : '/'}${images[0]}`)
        : 'https://via.placeholder.com/800x600?text=No+Image';

    const renderStars = (rating = 0) => {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={{ color: THEME.textPrimary, marginLeft: 4, fontWeight: '700', fontSize: 13 }}>
                    {rating > 0 ? rating.toFixed(1) : 'No rating'}
                </Text>
            </View>
        );
    };

    const incrementQty = () => {
        if (!item.stockInSqFt || qty < item.stockInSqFt) {
            setQty(prev => prev + 1);
        }
    };

    const decrementQty = () => setQty(prev => Math.max(1, prev - 1));

    const handleAdd = () => onAddToCart(item, qty);

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(item)} activeOpacity={0.9}>
            {images.length > 1 ? (
                <View>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16}
                        onMomentumScrollEnd={(e) => {
                            const i = Math.round(e.nativeEvent.contentOffset.x / CATALOG_CARD_IMAGE_WIDTH);
                            setCardImageIndex(i);
                        }}
                    >
                        {images.map((img, index) => (
                            <Image
                                key={index}
                                source={{ uri: buildImageUri(img, serverUrl) }}
                                style={styles.slabImagePaged}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                    <View style={styles.imageDotsRow} pointerEvents="none">
                        {images.map((_, i) => (
                            <View key={i} style={[styles.imageDot, i === cardImageIndex && styles.imageDotActive]} />
                        ))}
                    </View>
                </View>
            ) : (
                <Image source={{ uri: finalImageUrl }} style={styles.slabImage} resizeMode="cover" />
            )}
            <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>Granite Slab</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <Text style={[styles.stoneName, { marginBottom: 0, flex: 1 }]} numberOfLines={1}>{item.stoneName}</Text>
                    {renderStars(item.rating)}
                </View>
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
                    <View style={styles.qtyActions}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={decrementQty} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="minus" size={18} color={THEME.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={incrementQty} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="plus" size={18} color={THEME.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.addCartBtn} onPress={handleAdd} activeOpacity={0.85}>
                        <MaterialCommunityIcons name="cart-plus" size={16} color="#fff" />
                        <Text style={styles.addCartText}>Add</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const CatalogHeader = ({ isSearchActive, setIsSearchActive, searchQuery, setSearchQuery, onNavigateProfile }) => (
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8}
                onPress={() => {
                    if (isSearchActive) { setSearchQuery(''); setIsSearchActive(false); }
                    else { setIsSearchActive(true); }
                }}>
                <MaterialCommunityIcons name={isSearchActive ? "close" : "magnify"} size={22} color={THEME.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8} onPress={onNavigateProfile}>
                <MaterialCommunityIcons name="account-outline" size={22} color={THEME.textPrimary} />
            </TouchableOpacity>
        </View>
    </View>
);

const CustomerCatalogScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [cartCount, setCartCount] = useState(0);
    const [cartTotal, setCartTotal] = useState(0);

    useEffect(() => { fetchInventory(); }, []);
    useEffect(() => {
        if (selectedProduct) setModalImageIndex(0);
    }, [selectedProduct?._id]);

    const loadCartInfo = async () => {
        try {
            const cartKey = await getUserCartKey();
            const cartData = await AsyncStorage.getItem(cartKey);
            const cart = cartData ? JSON.parse(cartData) : [];
            setCartCount(cart.reduce((sum, item) => sum + (item.qty || 1), 0));
            setCartTotal(cart.reduce((sum, item) => sum + (item.pricePerSqFt * (item.qty || 1)), 0));
        } catch { setCartCount(0); setCartTotal(0); }
    };

    useFocusEffect(useCallback(() => { loadCartInfo(); }, []));

    const handleAddToCart = async (product, qty) => {
        await addToCart(product, qty);
        await loadCartInfo();
    };

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
            const response = await productService.getAll();
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
                <CatalogHeader isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onNavigateProfile={() => navigation.navigate('Profile')} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={THEME.gold} />
                    <Text style={styles.loadingText}>Loading Catalogue…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
            <View style={styles.blobTopRight} />

            <CatalogHeader isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onNavigateProfile={() => navigation.navigate('Profile')} />

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <SlabCard item={item} onAddToCart={handleAddToCart} onPress={(prod) => { setSelectedProduct(prod); setModalVisible(true); }} />}
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
                onNavigateCatalog={() => {}}
                onNavigateCart={() => navigation.navigate('Cart')}
                onNavigateOrders={() => navigation.navigate('MyOrders')}
                onNavigateSupport={() => navigation.navigate('MyTickets')}
                cartCount={cartCount}
                cartTotal={cartTotal}
            />

            {/* Product Details Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => { setModalVisible(false); setSelectedProduct(null); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedProduct && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View>
                                    <View style={styles.modalCarouselWrap}>
                                        <ScrollView
                                            horizontal
                                            pagingEnabled
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.modalCarousel}
                                            scrollEventThrottle={16}
                                            onMomentumScrollEnd={(e) => {
                                                const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                                setModalImageIndex(i);
                                            }}
                                        >
                                            {(selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0
                                                ? selectedProduct.imageUrls
                                                : (selectedProduct.imageUrl ? [selectedProduct.imageUrl] : [])
                                            ).map((img, index) => {
                                                const serverUrl = getServerUrl();
                                                const uri = buildImageUri(img, serverUrl);
                                                return (
                                                    <Image
                                                        key={index}
                                                        source={{ uri }}
                                                        style={styles.modalImage}
                                                        resizeMode="cover"
                                                    />
                                                );
                                            })}
                                            {(!selectedProduct.imageUrls || selectedProduct.imageUrls.length === 0) && !selectedProduct.imageUrl && (
                                                <Image
                                                    source={{ uri: 'https://via.placeholder.com/800x600?text=No+Image' }}
                                                    style={styles.modalImage}
                                                    resizeMode="cover"
                                                />
                                            )}
                                        </ScrollView>
                                        {(() => {
                                            const urls = selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0
                                                ? selectedProduct.imageUrls
                                                : (selectedProduct.imageUrl ? [selectedProduct.imageUrl] : []);
                                            if (urls.length <= 1) return null;
                                            return (
                                                <View style={styles.modalImageDotsRow} pointerEvents="none">
                                                    {urls.map((_, i) => (
                                                        <View key={i} style={[styles.imageDot, i === modalImageIndex && styles.imageDotActive]} />
                                                    ))}
                                                </View>
                                            );
                                        })()}
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.closeModalBtn} onPress={() => { setModalVisible(false); setSelectedProduct(null); }}>
                                    <MaterialCommunityIcons name="close" size={24} color="#fff" />
                                </TouchableOpacity>

                                <View style={styles.modalBody}>
                                    <View style={styles.modalHeaderRow}>
                                        <Text style={styles.modalTitle}>{selectedProduct.stoneName}</Text>
                                        <View style={styles.modalRating}>
                                            <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                                            <Text style={styles.modalRatingText}>
                                                {selectedProduct.rating > 0 ? selectedProduct.rating.toFixed(1) : 'N/A'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.modalPriceRow}>
                                        <Text style={styles.modalPrice} numberOfLines={2}>
                                            LKR {selectedProduct.pricePerSqFt}
                                            <Text style={styles.modalPriceSub}>/SqFt</Text>
                                        </Text>
                                        <View style={styles.modalStockBlock}>
                                            <Text style={styles.modalStockLabel}>Available stock</Text>
                                            <View style={styles.modalStockValueRow}>
                                                <MaterialCommunityIcons name="layers-outline" size={16} color={THEME.gold} style={styles.modalStockIcon} />
                                                <Text style={styles.modalStockValue}>
                                                    {selectedProduct.stockInSqFt} SqFt
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.reviewsSection}>
                                        <Text style={styles.reviewsTitle}>Customer Reviews</Text>
                                        {(!selectedProduct.reviews || selectedProduct.reviews.length === 0) ? (
                                            <Text style={styles.noReviewsText}>No reviews yet for this slab.</Text>
                                        ) : (
                                            selectedProduct.reviews.map((r, idx) => (
                                                <View key={idx} style={styles.reviewCard}>
                                                    <View style={styles.reviewHeader}>
                                                        <Text style={styles.reviewUser}>{r.user}</Text>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            {[...Array(5)].map((_, i) => (
                                                                <MaterialCommunityIcons key={i} name="star" size={14} color={i < r.rating ? "#FFD700" : THEME.border} />
                                                            ))}
                                                        </View>
                                                    </View>
                                                    <Text style={styles.reviewText}>{r.text}</Text>
                                                    <Text style={styles.reviewDate}>{new Date(r.createdAt || Date.now()).toLocaleDateString()}</Text>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                        {selectedProduct && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.modalAddCartBtn} onPress={() => { handleAddToCart(selectedProduct, 1); setModalVisible(false); }}>
                                    <MaterialCommunityIcons name="cart-plus" size={20} color="#fff" />
                                    <Text style={styles.modalAddCartText}>Add to Cart</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    blobTopRight: { position: 'absolute', top: -40, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: THEME.blobGold },

    header: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: THEME.border,
    },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: THEME.gold, letterSpacing: 2, marginBottom: 2 },
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
    slabImagePaged: { width: CATALOG_CARD_IMAGE_WIDTH, height: 200, backgroundColor: 'rgba(255,255,255,0.04)' },
    imageDotsRow: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 3 },
    imageDotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
    categoryTag: { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(15,15,30,0.75)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
    categoryTagText: { color: THEME.textPrimary, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    cardContent: { padding: 16 },
    stoneName: { fontSize: 20, fontWeight: '800', color: THEME.textPrimary, marginBottom: 10 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    metaChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, gap: 4 },
    metaChipText: { fontSize: 13, color: THEME.textSecondary, fontWeight: '500' },
    priceBadge: { backgroundColor: THEME.goldLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    priceText: { fontSize: 15, fontWeight: '800', color: THEME.gold },
    priceSub: { fontSize: 12, fontWeight: '500', color: THEME.gold },

    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qtyActions: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 8, height: 38 },
    qtyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    qtyValue: { minWidth: 32, textAlign: 'center', color: THEME.textPrimary, fontWeight: '700', fontSize: 15, marginHorizontal: 8 },
    addCartBtn: { width: 108, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: THEME.gold, borderRadius: 10, paddingVertical: 11, shadowColor: THEME.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    addCartText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    bottomNav: {
        flexDirection: 'row', backgroundColor: THEME.navBg,
        paddingVertical: 10, paddingHorizontal: 10,
        borderTopWidth: 1, borderTopColor: THEME.border,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
    navLabel: { fontSize: 11, fontWeight: '600' },
    cartBadge: {
        position: 'absolute', top: -6, right: -10,
        backgroundColor: THEME.danger || '#EF4444',
        borderRadius: 10, minWidth: 18, height: 18,
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5, borderColor: THEME.navBg || '#1a1a2e',
    },
    cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', textAlign: 'center' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: THEME.bg },
    modalContent: { flex: 1, backgroundColor: THEME.bgCard, borderWidth: 0, borderColor: THEME.border },
    modalCarouselWrap: { position: 'relative' },
    modalCarousel: { height: 300 },
    modalImage: { width: SCREEN_WIDTH, height: 300 },
    modalImageDotsRow: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    closeModalBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 6 },
    modalBody: { padding: 20 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 24, fontWeight: '800', color: THEME.textPrimary, flex: 1 },
    modalRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    modalRatingText: { color: THEME.textPrimary, marginLeft: 6, fontWeight: '700', fontSize: 14 },
    modalPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    modalPrice: { flex: 1, minWidth: 0, fontSize: 20, fontWeight: '800', color: THEME.gold },
    modalPriceSub: { fontSize: 14, fontWeight: '500', color: THEME.gold },
    modalStockBlock: { alignItems: 'flex-end', flexShrink: 0 },
    modalStockLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: THEME.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 4,
    },
    modalStockValueRow: { flexDirection: 'row', alignItems: 'center' },
    modalStockIcon: { marginRight: 4, opacity: 0.9 },
    modalStockValue: { fontSize: 16, fontWeight: '800', color: THEME.textPrimary },
    reviewsSection: { borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 20, paddingBottom: 20 },
    reviewsTitle: { fontSize: 18, fontWeight: '700', color: THEME.textPrimary, marginBottom: 16 },
    noReviewsText: { color: THEME.textSecondary, fontStyle: 'italic', fontSize: 14 },
    reviewCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: THEME.border },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reviewUser: { color: THEME.textPrimary, fontWeight: '600', fontSize: 14 },
    reviewText: { color: THEME.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 8 },
    reviewDate: { color: THEME.textMuted, fontSize: 11, textAlign: 'right' },
    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: THEME.border, backgroundColor: THEME.bgCard },
    modalAddCartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: THEME.gold, borderRadius: 12, paddingVertical: 14, shadowColor: THEME.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    modalAddCartText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default CustomerCatalogScreen;