import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminDashboardScreen = ({ navigation }) => {
    
    // The Admin escape hatch!
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            navigation.replace('Login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // A reusable button component for our grid
    const DashboardCard = ({ title, color, onPress }) => (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: color }]}
            onPress={onPress}
        >
            <Text style={styles.cardText}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manager Portal</Text>
                <Text style={styles.headerSub}>Control Center</Text>
            </View>

            <View style={styles.grid}>
                {/* We will wire up this Add Product button next! */}
                <DashboardCard 
                    title="Add Product" 
                    color="#2a9d8f" 
                    onPress={() => navigation.navigate('AddProduct')} 
                />
                <DashboardCard title="Manage Suppliers" color="#e9c46a" onPress={() => {}} />
                <DashboardCard title="Check Orders" color="#f4a261" onPress={() => {}} />
                <DashboardCard title="Deliveries" color="#e76f51" onPress={() => {}} />
            </View>

            {/* Log Out Button anchored to the bottom */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

// ONLY ONE styles object down here!
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    header: { padding: 30, backgroundColor: '#2b2d42', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    headerSub: { fontSize: 16, color: '#8d99ae', marginTop: 5 },
    grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 15, justifyContent: 'space-between', alignContent: 'flex-start' },
    card: { 
        width: '47%', 
        height: 150, 
        borderRadius: 15, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 15,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5
    },
    cardText: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center', padding: 10 },
    logoutButton: { 
        backgroundColor: '#e76f51', 
        padding: 15, 
        margin: 20, 
        borderRadius: 10, 
        alignItems: 'center',
        position: 'absolute', // Keeps it at the bottom of the screen
        bottom: 10,
        left: 0,
        right: 0
    },
    logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default AdminDashboardScreen;