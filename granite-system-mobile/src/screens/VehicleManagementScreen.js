import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';

const COLORS = { dark:'#1e2235', accent:'#7b2d8b', accentLight:'#f3e8f8', danger:'#e63946', dangerLight:'#fdecea', bg:'#f0f2f5', white:'#ffffff', textPrimary:'#1e2235', textSub:'#6b7280', border:'#e5e7eb', teal:'#2a9d8f', tealLight:'#e8f5f4' };
const STATUS_OPTIONS = ['Available','On Route','Maintenance'];
const getStatusColor = (s) => { if(s==='Available') return {text:'#2a9d8f',bg:'#e8f5f4'}; if(s==='On Route') return {text:'#f4a261',bg:'#fdf3ea'}; if(s==='Maintenance') return {text:'#e63946',bg:'#fdecea'}; return {text:COLORS.textSub,bg:COLORS.bg}; };

const VehicleRow = ({ item, onEdit, onDelete }) => {
    const sc = getStatusColor(item.status);
    return (
        <View style={st.row}><View style={st.rowBody}><View style={st.rowInfo}>
            <Text style={st.rowName} numberOfLines={1}>{item.licensePlate}</Text>
            <View style={st.rowMeta}>
                <View style={[st.badge,{backgroundColor:sc.bg}]}><Text style={[st.badgeText,{color:sc.text}]}>{item.status}</Text></View>
                <Text style={st.metaText}>{item.vehicleType}</Text>
            </View>
            <Text style={st.subText}>Capacity: {item.maxWeightCapacity} kg</Text>
        </View>
        <View style={st.rowActions}>
            <TouchableOpacity style={[st.actionBtn,st.updateBtn]} onPress={()=>onEdit(item)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.accent}/><Text style={[st.actionText,{color:COLORS.accent}]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.actionBtn,st.deleteBtn]} onPress={()=>onDelete(item)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger}/><Text style={[st.actionText,{color:COLORS.danger}]}>Delete</Text>
            </TouchableOpacity>
        </View></View></View>
    );
};

const VehicleManagementScreen = ({ navigation }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [editing, setEditing] = useState(null);
    const [licensePlate, setLicensePlate] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [capacity, setCapacity] = useState('');
    const [status, setStatus] = useState('Available');
    const [formLoading, setFormLoading] = useState(false);
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);

    useFocusEffect(useCallback(() => { fetchVehicles(); }, []));

    const fetchVehicles = async (isRefresh=false) => {
        if(isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await api.get('/vehicles',{headers:{Authorization:`Bearer ${token}`}});
            setVehicles(res.data.vehicles??res.data??[]);
        } catch(e){ Alert.alert('Fetch Error','Could not load vehicles.'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const openAdd = () => { setEditing(null); setLicensePlate(''); setVehicleType(''); setCapacity(''); setStatus('Available'); setFormVisible(true); };
    const openEdit = (item) => { setEditing(item); setLicensePlate(item.licensePlate); setVehicleType(item.vehicleType); setCapacity(String(item.maxWeightCapacity)); setStatus(item.status); setFormVisible(true); };

    const validateForm = () => {
        if(!licensePlate.trim()){Alert.alert('Validation Error','License plate is required.');return false;}
        if(licensePlate.trim().length<2){Alert.alert('Validation Error','License plate must be at least 2 characters.');return false;}
        if(!vehicleType.trim()){Alert.alert('Validation Error','Vehicle type is required.');return false;}
        if(vehicleType.trim().length<2){Alert.alert('Validation Error','Vehicle type must be at least 2 characters.');return false;}
        if(!capacity.trim()){Alert.alert('Validation Error','Max weight capacity is required.');return false;}
        const cap = parseFloat(capacity);
        if(isNaN(cap)||cap<=0){Alert.alert('Validation Error','Capacity must be a valid positive number.');return false;}
        return true;
    };

    const handleSubmit = async () => {
        if(!validateForm()) return;
        setFormLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const body = { licensePlate:licensePlate.trim(), vehicleType:vehicleType.trim(), maxWeightCapacity:parseFloat(capacity), status };
            if(editing) {
                await api.put(`/vehicles/${editing._id}`,body,{headers:{Authorization:`Bearer ${token}`}});
                Alert.alert('Success','Vehicle updated successfully.');
            } else {
                await api.post('/vehicles',body,{headers:{Authorization:`Bearer ${token}`}});
                Alert.alert('Success','Vehicle added successfully.');
            }
            setFormVisible(false); fetchVehicles();
        } catch(e){ Alert.alert('Error',e.response?.data?.message||e.response?.data?.errors?.[0]?.msg||'Could not save vehicle.'); }
        finally { setFormLoading(false); }
    };

    const handleDelete = (item) => {
        Alert.alert('Delete Vehicle',`Delete "${item.licensePlate}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{
            try { const token = await AsyncStorage.getItem('userToken'); await api.delete(`/vehicles/${item._id}`,{headers:{Authorization:`Bearer ${token}`}}); setVehicles(p=>p.filter(v=>v._id!==item._id)); }
            catch(e){ Alert.alert('Delete Failed','Could not delete vehicle.'); }
        }}]);
    };

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark}/>
            <View style={st.header}>
                <TouchableOpacity style={st.backBtn} onPress={()=>navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white}/></TouchableOpacity>
                <View style={st.headerText}><Text style={st.headerEyebrow}>ADMIN</Text><Text style={st.headerTitle}>Manage Vehicles</Text></View>
            </View>
            {loading?(<View style={st.centered}><ActivityIndicator size="large" color={COLORS.accent}/><Text style={st.loadingText}>Loading Vehicles…</Text></View>):(
                <><View style={st.statsBar}><Text style={st.statsText}>{vehicles.length} {vehicles.length===1?'Vehicle':'Vehicles'}</Text></View>
                <FlatList data={vehicles} keyExtractor={i=>i._id} renderItem={({item})=>(<VehicleRow item={item} onEdit={openEdit} onDelete={handleDelete}/>)}
                    contentContainerStyle={[st.listContent,vehicles.length===0&&st.listContentEmpty]}
                    ListEmptyComponent={<View style={st.emptyContainer}><MaterialCommunityIcons name="car-outline" size={72} color={COLORS.border}/><Text style={st.emptyTitle}>No Vehicles Yet</Text><Text style={st.emptySub}>Tap + to add a vehicle.</Text></View>}
                    refreshing={refreshing} onRefresh={()=>fetchVehicles(true)} showsVerticalScrollIndicator={false}/></>
            )}
            <TouchableOpacity style={st.fab} onPress={openAdd} activeOpacity={0.85}><MaterialCommunityIcons name="plus" size={30} color={COLORS.white}/></TouchableOpacity>

            {/* Add/Edit Form Modal */}
            <Modal visible={formVisible} transparent animationType="slide"><View style={st.modalOverlay}><View style={[st.modalContent,{width:'90%'}]}>
                <Text style={st.modalTitle}>{editing?'Edit Vehicle':'Add Vehicle'}</Text><ScrollView>
                <Text style={st.label}>License Plate</Text><TextInput style={st.input} placeholder="e.g. AB-1234" value={licensePlate} onChangeText={setLicensePlate}/>
                <Text style={st.label}>Vehicle Type / Model</Text><TextInput style={st.input} placeholder="e.g. Lorry, Truck" value={vehicleType} onChangeText={setVehicleType}/>
                <Text style={st.label}>Max Weight Capacity (kg)</Text><TextInput style={st.input} placeholder="e.g. 5000" value={capacity} onChangeText={setCapacity} keyboardType="numeric"/>
                <Text style={st.label}>Status</Text>
                <TouchableOpacity style={st.input} onPress={()=>setStatusPickerVisible(true)}><Text style={{fontSize:15,color:COLORS.textPrimary}}>{status}</Text></TouchableOpacity>
                <TouchableOpacity style={[st.submitBtn,formLoading&&{opacity:0.6}]} onPress={handleSubmit} disabled={formLoading}>{formLoading?<ActivityIndicator color="#fff"/>:<Text style={st.submitBtnText}>{editing?'Update Vehicle':'Add Vehicle'}</Text>}</TouchableOpacity>
                <TouchableOpacity style={st.modalCancel} onPress={()=>setFormVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
                </ScrollView></View></View></Modal>

            {/* Status Picker */}
            <Modal visible={statusPickerVisible} transparent animationType="fade"><View style={st.modalOverlay}><View style={st.modalContent}>
                <Text style={st.modalTitle}>Select Status</Text>
                {STATUS_OPTIONS.map(s=>(<TouchableOpacity key={s} style={[st.modalOption,status===s&&st.modalOptionActive]} onPress={()=>{setStatus(s);setStatusPickerVisible(false);}}>
                    <Text style={[st.modalOptionText,status===s&&st.modalOptionTextActive]}>{s}</Text></TouchableOpacity>))}
                <TouchableOpacity style={st.modalCancel} onPress={()=>setStatusPickerVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View></View></Modal>
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    container:{flex:1,backgroundColor:COLORS.bg},
    header:{backgroundColor:COLORS.dark,paddingHorizontal:20,paddingTop:16,paddingBottom:24,flexDirection:'row',alignItems:'center',gap:14,borderBottomLeftRadius:24,borderBottomRightRadius:24},
    backBtn:{backgroundColor:'rgba(255,255,255,0.12)',borderRadius:12,padding:9},headerText:{flex:1},
    headerEyebrow:{fontSize:11,fontWeight:'700',color:COLORS.accent,letterSpacing:2,marginBottom:2},headerTitle:{fontSize:22,fontWeight:'800',color:COLORS.white},
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

export default VehicleManagementScreen;
