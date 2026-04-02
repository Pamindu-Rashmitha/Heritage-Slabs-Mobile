import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 

// Import all screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import CustomerCatalogScreen from './src/screens/CustomerCatalogScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import ProductManagementScreen from './src/screens/ProductManagementScreen';
import EditProductScreen from './src/screens/EditProductScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import OrderManagementScreen from './src/screens/OrderManagementScreen';
import DeliveryManagementScreen from './src/screens/DeliveryManagementScreen';
import VehicleManagementScreen from './src/screens/VehicleManagementScreen';
import SupplierManagementScreen from './src/screens/SupplierManagementScreen';
import TicketManagementScreen from './src/screens/TicketManagementScreen';
import CartScreen from './src/screens/CartScreen';
import MyOrdersScreen from './src/screens/MyOrdersScreen';
import SubmitTicketScreen from './src/screens/SubmitTicketScreen';
import MyTicketsScreen from './src/screens/MyTicketsScreen';
import PurchaseOrderManagementScreen from './src/screens/PurchaseOrderManagementScreen';

const Stack = createNativeStackNavigator();

// Dark Glassmorphism navigation theme
const DarkGlassTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1',
    background: '#0F0F1E',
    card: '#0F0F1E',
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.06)',
    notification: '#A855F7',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkGlassTheme}>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F0F1E' }, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="EditProduct" component={EditProductScreen} />
          <Stack.Screen name="ProductManagement" component={ProductManagementScreen} />
          <Stack.Screen name="CustomerCatalog" component={CustomerCatalogScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="UserManagement" component={UserManagementScreen} />
          <Stack.Screen name="OrderManagement" component={OrderManagementScreen} />
          <Stack.Screen name="DeliveryManagement" component={DeliveryManagementScreen} />
          <Stack.Screen name="VehicleManagement" component={VehicleManagementScreen} />
          <Stack.Screen name="SupplierManagement" component={SupplierManagementScreen} />
          <Stack.Screen name="TicketManagement" component={TicketManagementScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
          <Stack.Screen name="SubmitTicket" component={SubmitTicketScreen} />
          <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
          <Stack.Screen name="PurchaseOrderManagement" component={PurchaseOrderManagementScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}