import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';


const SERVER_URL = 'http://192.168.1.8:5000';

const DashboardScreen = ({navigation}) => {
    // State to hold our granite slabs and a loading spinner
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            navigation.replace('Login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const fetchInventory = async () => {
        try {
            console.log("Attempting to fetch products...");
            const response = await api.get('/products');
            
            console.log("Success! Backend sent:", response.data); 

            if (response.data.products) {
                setProducts(response.data.products);
            } else {
                setProducts(response.data);
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Network/Backend Error:", error.response?.data || error.message);
            Alert.alert('Error', 'Failed to fetch inventory from the server.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);


  const renderSlabCard = ({ item }) => {
        // Look for 'imageUrl', and simply attach it to your server IP
        const finalImageUrl = item.imageUrl 
            ? `${SERVER_URL}${item.imageUrl}` 
            : 'https://via.placeholder.com/400x300?text=No+Image+Available';

        return (
            <View style={styles.card}>
                <Image 
                    source={{ uri: finalImageUrl }} 
                    style={styles.slabImage}
                    resizeMode="cover" 
                />
                
                <View style={styles.cardContent}>
                    <Text style={styles.stoneName}>{item.stoneName}</Text>
                    <View style={styles.detailsRow}>
                        <Text style={styles.detailText}>Stock: {item.stockInSqFt} SqFt</Text>
                    </View>
                    <Text style={styles.price}>LKR {item.pricePerSqFt} / SqFt</Text>
                </View>
            </View>
        );
    };

    // Show a loading spinner while waiting for the backend
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2b2d42" />
                <Text style={{ marginTop: 10 }}>Loading Inventory...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                keyExtractor={(item) => item._id} // Uses the MongoDB ID as the unique key
                renderItem={renderSlabCard}
                contentContainerStyle={styles.listPadding}
                refreshing={loading}
                onRefresh={fetchInventory} 
            />

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
};

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listPadding: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, 
    },
    stoneName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2b2d42',
        marginBottom: 10,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailText: {
        fontSize: 15,
        color: '#666',
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2a9d8f', 
        textAlign: 'right',
    },
    logoutButton: {
        backgroundColor: '#e76f51', 
        padding: 15,
        margin: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, 
        overflow: 'hidden', 
    },
    slabImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#e1e4e8',
    },
    cardContent: {
        padding: 20,
    },
});

export default DashboardScreen;