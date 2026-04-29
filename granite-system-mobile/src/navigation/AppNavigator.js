import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CustomerCatalogScreen from '../screens/CustomerCatalogScreen';
import AddProductScreen from '../screens/AddProductScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import EditProductScreen from '../screens/EditProductScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import OrderManagementScreen from '../screens/OrderManagementScreen';
import DeliveryManagementScreen from '../screens/DeliveryManagementScreen';
import VehicleManagementScreen from '../screens/VehicleManagementScreen';
import SupplierManagementScreen from '../screens/SupplierManagementScreen';
import TicketManagementScreen from '../screens/TicketManagementScreen';
import CartScreen from '../screens/CartScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import SubmitTicketScreen from '../screens/SubmitTicketScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import PurchaseOrderManagementScreen from '../screens/PurchaseOrderManagementScreen';

const StoneTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: THEME.gold,
        background: THEME.bg,
        card: THEME.navBg,
        text: THEME.textPrimary,
        border: THEME.border,
        notification: THEME.slate,
    },
};

const Auth = createNativeStackNavigator();
const Admin = createNativeStackNavigator();
const Customer = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor: THEME.bg },
    animation: 'fade_from_bottom',
};

function LogoutTabPlaceholder() {
    return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;
}

function CustomerTabs() {
    const { logout } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: THEME.navBg,
                    borderTopColor: THEME.border,
                },
                tabBarActiveTintColor: THEME.navActive,
                tabBarInactiveTintColor: THEME.navInactive,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'MyOrders':
                            iconName = focused ? 'receipt' : 'receipt-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'log-out-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={CustomerCatalogScreen} options={{ title: 'Catalog' }} />
            <Tab.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen
                name="Log out"
                component={LogoutTabPlaceholder}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="log-out-outline" size={size} color={THEME.danger} />,
                    tabBarActiveTintColor: THEME.danger,
                }}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        logout();
                    },
                }}
            />
        </Tab.Navigator>
    );
}

function AuthStack() {
    return (
        <Auth.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: THEME.bg } }}>
            <Auth.Screen name="Login" component={LoginScreen} />
            <Auth.Screen name="Register" component={RegisterScreen} />
        </Auth.Navigator>
    );
}

function AdminStack() {
    return (
        <Admin.Navigator screenOptions={stackScreenOptions}>
            <Admin.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Admin.Screen name="AddProduct" component={AddProductScreen} />
            <Admin.Screen name="EditProduct" component={EditProductScreen} />
            <Admin.Screen name="ProductManagement" component={ProductManagementScreen} />
            <Admin.Screen name="UserManagement" component={UserManagementScreen} />
            <Admin.Screen name="OrderManagement" component={OrderManagementScreen} />
            <Admin.Screen name="DeliveryManagement" component={DeliveryManagementScreen} />
            <Admin.Screen name="VehicleManagement" component={VehicleManagementScreen} />
            <Admin.Screen name="SupplierManagement" component={SupplierManagementScreen} />
            <Admin.Screen name="TicketManagement" component={TicketManagementScreen} />
            <Admin.Screen name="PurchaseOrderManagement" component={PurchaseOrderManagementScreen} />
        </Admin.Navigator>
    );
}

function CustomerStack() {
    return (
        <Customer.Navigator screenOptions={stackScreenOptions}>
            <Customer.Screen name="CustomerTabs" component={CustomerTabs} />
            <Customer.Screen name="Cart" component={CartScreen} />
            <Customer.Screen name="SubmitTicket" component={SubmitTicketScreen} />
            <Customer.Screen name="MyTickets" component={MyTicketsScreen} />
            <Customer.Screen name="EditProfile" component={EditProfileScreen} />
            <Customer.Screen name="HelpSupport" component={HelpSupportScreen} />
        </Customer.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: THEME.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.gold} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={StoneTheme}>
            {!user ? (
                <AuthStack />
            ) : user.role === 'Admin' ? (
                <AdminStack />
            ) : (
                <CustomerStack />
            )}
        </NavigationContainer>
    );
}
