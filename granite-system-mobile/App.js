import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
          <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
          <Stack.Screen name="ProductManagement" component={ProductManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CustomerCatalog" component={CustomerCatalogScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OrderManagement" component={OrderManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DeliveryManagement" component={DeliveryManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VehicleManagement" component={VehicleManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SupplierManagement" component={SupplierManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TicketManagement" component={TicketManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SubmitTicket" component={SubmitTicketScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PurchaseOrderManagement" component={PurchaseOrderManagementScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}