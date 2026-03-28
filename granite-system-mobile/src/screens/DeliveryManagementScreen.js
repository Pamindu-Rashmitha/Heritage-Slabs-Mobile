import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';

const COLORS = { dark:'#1e2235', accent:'#4361ee', accentLight:'#eaedfc', danger:'#e63946', dangerLight:'#fdecea', bg:'#f0f2f5', white:'#ffffff', textPrimary:'#1e2235', textSub:'#6b7280', border:'#e5e7eb' };
const STATUS_FLOW = ['Scheduled', 'In Transit', 'Completed'];
const getStatusColor = (s) => { if(s==='Scheduled') return {text:'#4361ee',bg:'#eaedfc'}; if(s==='In Transit') return {text:'#f4a261',bg:'#fdf3ea'}; if(s==='Completed') return {text:'#2a9d8f',bg:'#e8f5f4'}; return {text:COLORS.textSub,bg:COLORS.bg}; };

const DeliveryRow = ({ item, onUpdateStatus, onDelete }) => {
    const sc = getStatusColor(item.status);
    return (
        <View style={s.row}><View style={s.rowBody}><View style={s.rowInfo}>
            <Text style={s.rowName} numberOfLines={1}>Driver: {item.driverName}</Text>
            <View style={s.rowMeta}>
                <View style={[s.badge,{backgroundColor:sc.bg}]}><Text style={[s.badgeText,{color:sc.text}]}>{item.status}</Text></View>
                <Text style={s.metaText}>{item.vehicle?.licensePlate||'N/A'}</Text>
            </View>
            <Text style={s.subText}>Order by: {item.order?.user?.name||'Unknown'}</Text>
            <Text style={s.subText}>ETA: {new Date(item.expectedDeliveryDate).toLocaleDateString()}</Text>
        </View>
        <View style={s.rowActions}>
            <TouchableOpacity style={[s.actionBtn,s.updateBtn]} onPress={()=>onUpdateStatus(item)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="swap-horizontal" size={18} color={COLORS.accent}/><Text style={[s.actionText,{color:COLORS.accent}]}>Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn,s.deleteBtn]} onPress={()=>onDelete(item)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger}/><Text style={[s.actionText,{color:COLORS.danger}]}>Delete</Text>
            </TouchableOpacity>
        </View></View></View>
    );
};

const DeliveryManagementScreen = ({ navigation }) => {
    const [deliveries, setDeliveries] = useState([]);
    const [orders, setOrders] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [formModalVisible, setFormModalVisible] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [driverName, setDriverName] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [orderPickerVisible, setOrderPickerVisible] = useState(false);
    const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);

    useFocusEffect(useCallback(() => { fetchAllData(); }, []));

    const fetchAllData = async (isRefresh=false) => {
        if(isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const h = { Authorization:`Bearer ${token}` };
            const [dR,oR,vR] = await Promise.all([api.get('/deliveries',{headers:h}),api.get('/orders',{headers:h}),api.get('/vehicles',{headers:h})]);
            setDeliveries(dR.data.deliveries??dR.data??[]);
            setOrders(oR.data.orders??oR.data??[]);
            setVehicles(vR.data.vehicles??vR.data??[]);
        } catch(e){ Alert.alert('Fetch Error','Could not load data.'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const openAddForm = () => { setSelectedOrderId(''); setSelectedVehicleId(''); setDriverName(''); setExpectedDate(''); setFormModalVisible(true); };

    const validateForm = () => {
        if(!selectedOrderId){Alert.alert('Validation Error','Please select an order.');return false;}
        if(!selectedVehicleId){Alert.alert('Validation Error','Please select a vehicle.');return false;}
        if(!driverName.trim()){Alert.alert('Validation Error','Driver name is required.');return false;}
        if(driverName.trim().length<2){Alert.alert('Validation Error','Driver name must be at least 2 characters.');return false;}
        if(!expectedDate.trim()){Alert.alert('Validation Error','Expected delivery date is required.');return false;}
        if(!/^\d{4}-\d{2}-\d{2}$/.test(expectedDate.trim())){Alert.alert('Validation Error','Date must be in YYYY-MM-DD format.');return false;}
        return true;
    };

    const handleSubmit = async () => {
        if(!validateForm()) return;
        setFormLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            await api.post('/deliveries',{order:selectedOrderId,vehicle:selectedVehicleId,driverName:driverName.trim(),expectedDeliveryDate:expectedDate.trim()},{headers:{Authorization:`Bearer ${token}`}});
            Alert.alert('Success','Delivery scheduled successfully.');
            setFormModalVisible(false); fetchAllData();
        } catch(e){ Alert.alert('Error',e.response?.data?.message||'Could not create delivery.'); }
        finally { setFormLoading(false); }
    };

    const confirmStatusUpdate = async (newStatus) => {
        setStatusModalVisible(false);
        try { const token = await AsyncStorage.getItem('userToken'); await api.put(`/deliveries/${selectedDelivery._id}`,{status:newStatus},{headers:{Authorization:`Bearer ${token}`}}); setDeliveries(p=>p.map(d=>d._id===selectedDelivery._id?{...d,status:newStatus}:d)); }
        catch(e){ Alert.alert('Update Failed','Could not update delivery status.'); }
    };

    const handleDelete = (item) => {
        Alert.alert('Delete Delivery','Are you sure?',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{
            try { const token = await AsyncStorage.getItem('userToken'); await api.delete(`/deliveries/${item._id}`,{headers:{Authorization:`Bearer ${token}`}}); setDeliveries(p=>p.filter(d=>d._id!==item._id)); }
            catch(e){ Alert.alert('Delete Failed','Could not delete the delivery.'); }
        }}]);
    };

    const getOrderLabel = () => { const o=orders.find(x=>x._id===selectedOrderId); return o?`${o.user?.name||'Unknown'} - LKR ${o.totalPrice}`:'Tap to select order'; };
    const getVehicleLabel = () => { const v=vehicles.find(x=>x._id===selectedVehicleId); return v?`${v.licensePlate} (${v.vehicleType})`:'Tap to select vehicle'; };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark}/>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white}/></TouchableOpacity>
                <View style={s.headerText}><Text style={s.headerEyebrow}>ADMIN</Text><Text style={s.headerTitle}>Manage Deliveries</Text></View>
            </View>
            {loading?(<View style={s.centered}><ActivityIndicator size="large" color={COLORS.accent}/><Text style={s.loadingText}>Loading Deliveries…</Text></View>):(
                <><View style={s.statsBar}><Text style={s.statsText}>{deliveries.length} {deliveries.length===1?'Delivery':'Deliveries'}</Text></View>
                <FlatList data={deliveries} keyExtractor={i=>i._id} renderItem={({item})=>(<DeliveryRow item={item} onUpdateStatus={i=>{setSelectedDelivery(i);setStatusModalVisible(true);}} onDelete={handleDelete}/>)}
                    contentContainerStyle={[s.listContent,deliveries.length===0&&s.listContentEmpty]}
                    ListEmptyComponent={<View style={s.emptyContainer}><MaterialCommunityIcons name="truck-delivery-outline" size={72} color={COLORS.border}/><Text style={s.emptyTitle}>No Deliveries Yet</Text><Text style={s.emptySub}>Tap + to schedule a delivery.</Text></View>}
                    refreshing={refreshing} onRefresh={()=>fetchAllData(true)} showsVerticalScrollIndicator={false}/></>
            )}
            <TouchableOpacity style={s.fab} onPress={openAddForm} activeOpacity={0.85}><MaterialCommunityIcons name="plus" size={30} color={COLORS.white}/></TouchableOpacity>

            {/* Status Modal */}
            <Modal visible={statusModalVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={s.modalContent}>
                <Text style={s.modalTitle}>Update Delivery Status</Text>
                {STATUS_FLOW.map(st=>(<TouchableOpacity key={st} style={[s.modalOption,selectedDelivery?.status===st&&s.modalOptionActive]} onPress={()=>confirmStatusUpdate(st)}><Text style={[s.modalOptionText,selectedDelivery?.status===st&&s.modalOptionTextActive]}>{st}</Text></TouchableOpacity>))}
                <TouchableOpacity style={s.modalCancel} onPress={()=>setStatusModalVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>

            {/* Add Form Modal */}
            <Modal visible={formModalVisible} transparent animationType="slide"><View style={s.modalOverlay}><View style={[s.modalContent,{width:'90%'}]}>
                <Text style={s.modalTitle}>Schedule Delivery</Text><ScrollView>
                <Text style={s.label}>Order</Text>
                <TouchableOpacity style={s.input} onPress={()=>setOrderPickerVisible(true)}><Text style={{color:selectedOrderId?COLORS.textPrimary:'#999',fontSize:15}}>{getOrderLabel()}</Text></TouchableOpacity>
                <Text style={s.label}>Vehicle</Text>
                <TouchableOpacity style={s.input} onPress={()=>setVehiclePickerVisible(true)}><Text style={{color:selectedVehicleId?COLORS.textPrimary:'#999',fontSize:15}}>{getVehicleLabel()}</Text></TouchableOpacity>
                <Text style={s.label}>Driver Name</Text><TextInput style={s.input} placeholder="Enter driver name" value={driverName} onChangeText={setDriverName}/>
                <Text style={s.label}>Expected Date (YYYY-MM-DD)</Text><TextInput style={s.input} placeholder="e.g. 2026-04-10" value={expectedDate} onChangeText={setExpectedDate}/>
                <TouchableOpacity style={[s.submitBtn,formLoading&&{opacity:0.6}]} onPress={handleSubmit} disabled={formLoading}>{formLoading?<ActivityIndicator color="#fff"/>:<Text style={s.submitBtnText}>Schedule Delivery</Text>}</TouchableOpacity>
                <TouchableOpacity style={s.modalCancel} onPress={()=>setFormModalVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
                </ScrollView></View></View></Modal>

            {/* Order Picker */}
            <Modal visible={orderPickerVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={[s.modalContent,{width:'90%',maxHeight:'60%'}]}>
                <Text style={s.modalTitle}>Select Order</Text>
                <FlatList data={orders} keyExtractor={i=>i._id} renderItem={({item})=>(
                    <TouchableOpacity style={[s.modalOption,selectedOrderId===item._id&&s.modalOptionActive]} onPress={()=>{setSelectedOrderId(item._id);setOrderPickerVisible(false);}}>
                        <Text style={[s.modalOptionText,selectedOrderId===item._id&&s.modalOptionTextActive]}>{item.user?.name||'Unknown'} - LKR {item.totalPrice}</Text>
                    </TouchableOpacity>
                )} ListEmptyComponent={<Text style={{textAlign:'center',color:COLORS.textSub,padding:20}}>No orders available</Text>}/>
                <TouchableOpacity style={s.modalCancel} onPress={()=>setOrderPickerVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>

            {/* Vehicle Picker */}
            <Modal visible={vehiclePickerVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={[s.modalContent,{width:'90%',maxHeight:'60%'}]}>
                <Text style={s.modalTitle}>Select Vehicle</Text>
                <FlatList data={vehicles} keyExtractor={i=>i._id} renderItem={({item})=>(
                    <TouchableOpacity style={[s.modalOption,selectedVehicleId===item._id&&s.modalOptionActive]} onPress={()=>{setSelectedVehicleId(item._id);setVehiclePickerVisible(false);}}>
                        <Text style={[s.modalOptionText,selectedVehicleId===item._id&&s.modalOptionTextActive]}>{item.licensePlate} ({item.vehicleType})</Text>
                    </TouchableOpacity>
                )} ListEmptyComponent={<Text style={{textAlign:'center',color:COLORS.textSub,padding:20}}>No vehicles available</Text>}/>
                <TouchableOpacity style={s.modalCancel} onPress={()=>setVehiclePickerVisible(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container:{flex:1,backgroundColor:COLORS.bg},
    header:{backgroundColor:COLORS.dark,paddingHorizontal:20,paddingTop:16,paddingBottom:24,flexDirection:'row',alignItems:'center',gap:14,borderBottomLeftRadius:24,borderBottomRightRadius:24},
    backBtn:{backgroundColor:'rgba(255,255,255,0.12)',borderRadius:12,padding:9},
    headerText:{flex:1},headerEyebrow:{fontSize:11,fontWeight:'700',color:COLORS.accent,letterSpacing:2,marginBottom:2},headerTitle:{fontSize:22,fontWeight:'800',color:COLORS.white},
    statsBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingVertical:12},statsText:{fontSize:13,color:COLORS.textSub,fontWeight:'500'},
    centered:{flex:1,justifyContent:'center',alignItems:'center'},loadingText:{marginTop:12,color:COLORS.textSub,fontSize:14},
    listContent:{paddingHorizontal:16,paddingBottom:100},listContentEmpty:{flex:1},
    row:{backgroundColor:COLORS.white,borderRadius:14,marginBottom:12,overflow:'hidden',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.07,shadowRadius:6,elevation:3},
    rowBody:{flexDirection:'row',alignItems:'center',paddingVertical:14,paddingHorizontal:16,gap:10},rowInfo:{flex:1},
    rowName:{fontSize:16,fontWeight:'700',color:COLORS.textPrimary,marginBottom:6},rowMeta:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4},
    badge:{borderRadius:6,paddingHorizontal:8,paddingVertical:3},badgeText:{fontSize:12,fontWeight:'600'},metaText:{fontSize:12,color:COLORS.textSub},subText:{fontSize:12,color:COLORS.textSub,marginBottom:2},
    rowActions:{flexDirection:'column',gap:6},actionBtn:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:6,borderRadius:8,minWidth:70,justifyContent:'center'},
    updateBtn:{backgroundColor:COLORS.accentLight},deleteBtn:{backgroundColor:COLORS.dangerLight},actionText:{fontSize:12,fontWeight:'700'},
    emptyContainer:{flex:1,justifyContent:'center',alignItems:'center',paddingTop:80},emptyTitle:{fontSize:20,fontWeight:'700',color:COLORS.textPrimary,marginTop:16},emptySub:{fontSize:14,color:COLORS.textSub,marginTop:6,textAlign:'center'},
    fab:{position:'absolute',bottom:28,right:24,width:60,height:60,borderRadius:30,backgroundColor:COLORS.accent,justifyContent:'center',alignItems:'center',shadowColor:COLORS.accent,shadowOffset:{width:0,height:6},shadowOpacity:0.45,shadowRadius:10,elevation:10},
    modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center'},modalContent:{backgroundColor:COLORS.white,borderRadius:16,padding:24,width:'80%'},
    modalTitle:{fontSize:18,fontWeight:'700',color:COLORS.textPrimary,marginBottom:16,textAlign:'center'},
    modalOption:{paddingVertical:12,paddingHorizontal:16,borderRadius:10,marginBottom:8,backgroundColor:COLORS.bg},modalOptionActive:{backgroundColor:COLORS.accentLight,borderWidth:1,borderColor:COLORS.accent},
    modalOptionText:{fontSize:15,fontWeight:'500',color:COLORS.textPrimary,textAlign:'center'},modalOptionTextActive:{color:COLORS.accent,fontWeight:'700'},
    modalCancel:{paddingVertical:12,marginTop:4},modalCancelText:{fontSize:15,fontWeight:'600',color:COLORS.textSub,textAlign:'center'},
    label:{fontSize:13,fontWeight:'600',color:COLORS.textPrimary,marginBottom:6,marginTop:12},
    input:{backgroundColor:COLORS.white,padding:14,borderRadius:10,borderWidth:1,borderColor:'#ccc',fontSize:15,justifyContent:'center'},
    submitBtn:{backgroundColor:COLORS.accent,padding:15,borderRadius:10,marginTop:20,alignItems:'center'},submitBtnText:{color:'#fff',fontSize:16,fontWeight:'700'},
});

export default DeliveryManagementScreen;
