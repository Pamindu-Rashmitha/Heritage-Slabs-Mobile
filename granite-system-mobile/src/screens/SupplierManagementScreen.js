import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';
import { THEME } from '../theme';

const SupplierRow = ({ item, onEdit, onDelete }) => (
    <View style={st.row}><View style={st.rowBody}><View style={st.rowInfo}>
        <Text style={st.rowName} numberOfLines={1}>{item.companyName}</Text>
        <Text style={st.subText}>Contact: {item.contactPerson}</Text>
        <Text style={st.subText}>{item.email}</Text>
        <Text style={st.subText}>{item.phone}</Text>
        <View style={st.rowMeta}><View style={[st.badge,{backgroundColor:THEME.warningBg}]}><Text style={[st.badgeText,{color:THEME.warning}]}>{item.materialsSupplied}</Text></View></View>
    </View>
    <View style={st.rowActions}>
        <TouchableOpacity style={[st.actionBtn,st.updateBtn]} onPress={()=>onEdit(item)} activeOpacity={0.8}><MaterialCommunityIcons name="pencil-outline" size={18} color={THEME.gold}/><Text style={[st.actionText,{color:THEME.gold}]}>Edit</Text></TouchableOpacity>
        <TouchableOpacity style={[st.actionBtn,st.deleteBtn]} onPress={()=>onDelete(item)} activeOpacity={0.8}><MaterialCommunityIcons name="trash-can-outline" size={18} color={THEME.danger}/><Text style={[st.actionText,{color:THEME.danger}]}>Delete</Text></TouchableOpacity>
    </View></View></View>
);

const SupplierManagementScreen = ({ navigation }) => {
    const [suppliers, setSuppliers] = useState([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
    const [formVisible, setFormVisible] = useState(false); const [editing, setEditing] = useState(null);
    const [companyName, setCompanyName] = useState(''); const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState(''); const [phone, setPhone] = useState(''); const [materials, setMaterials] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useFocusEffect(useCallback(() => { fetchSuppliers(); }, []));
    const fetchSuppliers = async (isRefresh=false) => { if(isRefresh) setRefreshing(true); else setLoading(true); try { const token = await AsyncStorage.getItem('userToken'); const res = await api.get('/suppliers',{headers:{Authorization:`Bearer ${token}`}}); setSuppliers(res.data.suppliers??res.data??[]); } catch(e){ Alert.alert('Fetch Error','Could not load suppliers.'); } finally { setLoading(false); setRefreshing(false); } };
    const openAdd = () => { setEditing(null); setCompanyName(''); setContactPerson(''); setEmail(''); setPhone(''); setMaterials(''); setFormVisible(true); };
    const openEdit = (item) => { setEditing(item); setCompanyName(item.companyName); setContactPerson(item.contactPerson); setEmail(item.email); setPhone(item.phone); setMaterials(item.materialsSupplied); setFormVisible(true); };
    const validateForm = () => { if(!companyName.trim()){Alert.alert('Validation Error','Company name is required.');return false;} if(companyName.trim().length<2){Alert.alert('Validation Error','Company name must be at least 2 characters.');return false;} if(!contactPerson.trim()){Alert.alert('Validation Error','Contact person is required.');return false;} if(contactPerson.trim().length<2){Alert.alert('Validation Error','Contact person must be at least 2 characters.');return false;} if(!email.trim()){Alert.alert('Validation Error','Email is required.');return false;} const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if(!emailRegex.test(email.trim())){Alert.alert('Validation Error','Please enter a valid email address.');return false;} if(!phone.trim()){Alert.alert('Validation Error','Phone number is required.');return false;} const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/; if(!phoneRegex.test(phone.trim())){Alert.alert('Validation Error','Please enter a valid phone number.');return false;} if(!materials.trim()){Alert.alert('Validation Error','Materials supplied is required.');return false;} return true; };
    const handleSubmit = async () => { if(!validateForm()) return; setFormLoading(true); try { const token = await AsyncStorage.getItem('userToken'); const body = { companyName:companyName.trim(), contactPerson:contactPerson.trim(), email:email.trim(), phone:phone.trim(), materialsSupplied:materials.trim() }; if(editing) { await api.put(`/suppliers/${editing._id}`,body,{headers:{Authorization:`Bearer ${token}`}}); Alert.alert('Success','Supplier updated successfully.'); } else { await api.post('/suppliers',body,{headers:{Authorization:`Bearer ${token}`}}); Alert.alert('Success','Supplier added successfully.'); } setFormVisible(false); fetchSuppliers(); } catch(e){ Alert.alert('Error',e.response?.data?.message||e.response?.data?.errors?.[0]?.msg||'Could not save supplier.'); } finally { setFormLoading(false); } };
    const handleDelete = (item) => { Alert.alert('Delete Supplier',`Delete "${item.companyName}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{ try { const token = await AsyncStorage.getItem('userToken'); await api.delete(`/suppliers/${item._id}`,{headers:{Authorization:`Bearer ${token}`}}); setSuppliers(p=>p.filter(s=>s._id!==item._id)); } catch(e){ Alert.alert('Delete Failed','Could not delete supplier.'); } }}]); };

    return (
        <SafeAreaView style={st.container} edges={['top']}><StatusBar barStyle="light-content" backgroundColor={THEME.bg}/>
            <View style={st.header}><TouchableOpacity style={st.backBtn} onPress={()=>navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={22} color={THEME.textPrimary}/></TouchableOpacity><View style={st.headerText}><Text style={st.headerEyebrow}>ADMIN</Text><Text style={st.headerTitle}>Manage Suppliers</Text></View></View>
            {loading?(<View style={st.centered}><ActivityIndicator size="large" color={THEME.gold}/><Text style={st.loadingText}>Loading Suppliers…</Text></View>):(
                <><View style={st.statsBar}><Text style={st.statsText}>{suppliers.length} {suppliers.length===1?'Supplier':'Suppliers'}</Text></View>
                <FlatList data={suppliers} keyExtractor={i=>i._id} renderItem={({item})=>(<SupplierRow item={item} onEdit={openEdit} onDelete={handleDelete}/>)}
                    contentContainerStyle={[st.listContent,suppliers.length===0&&st.listContentEmpty]}
                    ListEmptyComponent={<View style={st.emptyContainer}><MaterialCommunityIcons name="factory" size={72} color={THEME.textMuted}/><Text style={st.emptyTitle}>No Suppliers Yet</Text><Text style={st.emptySub}>Tap + to add a supplier.</Text></View>}
                    refreshing={refreshing} onRefresh={()=>fetchSuppliers(true)} showsVerticalScrollIndicator={false}/></>
            )}
            <TouchableOpacity style={st.fab} onPress={openAdd} activeOpacity={0.85}><MaterialCommunityIcons name="plus" size={30} color="#fff"/></TouchableOpacity>

            <Modal visible={formVisible} transparent animationType="slide"><View style={st.modalOverlay}><View style={[st.modalContent,{width:'90%'}]}>
                <Text style={st.modalTitle}>{editing?'Edit Supplier':'Add Supplier'}</Text><ScrollView>
                <Text style={st.label}>Company Name</Text><TextInput style={st.input} placeholder="e.g. Lanka Granite Pvt Ltd" placeholderTextColor={THEME.textMuted} value={companyName} onChangeText={setCompanyName}/>
                <Text style={st.label}>Contact Person</Text><TextInput style={st.input} placeholder="e.g. John Silva" placeholderTextColor={THEME.textMuted} value={contactPerson} onChangeText={setContactPerson}/>
                <Text style={st.label}>Email</Text><TextInput style={st.input} placeholder="e.g. john@company.com" placeholderTextColor={THEME.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
                <Text style={st.label}>Phone Number</Text><TextInput style={st.input} placeholder="e.g. +94771234567" placeholderTextColor={THEME.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
                <Text style={st.label}>Materials Supplied</Text><TextInput style={st.input} placeholder="e.g. Black Galaxy, White Marble" placeholderTextColor={THEME.textMuted} value={materials} onChangeText={setMaterials}/>
                <TouchableOpacity style={[st.submitBtn,formLoading&&{opacity:0.6}]} onPress={handleSubmit} disabled={formLoading}>{formLoading?<ActivityIndicator color="#fff"/>:<Text style={st.submitBtnText}>{editing?'Update Supplier':'Add Supplier'}</Text>}</TouchableOpacity>
                <TouchableOpacity style={st.modalCancel} onPress={()=>setFormVisible(false)}><Text style={st.modalCancelText}>Cancel</Text></TouchableOpacity>
                </ScrollView></View></View></Modal>
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    container:{flex:1,backgroundColor:THEME.bg}, header:{backgroundColor:'rgba(255,255,255,0.04)',paddingHorizontal:20,paddingTop:16,paddingBottom:24,flexDirection:'row',alignItems:'center',gap:14,borderBottomWidth:1,borderBottomColor:THEME.border},
    backBtn:{backgroundColor:'rgba(255,255,255,0.08)',borderRadius:12,padding:9},headerText:{flex:1}, headerEyebrow:{fontSize:11,fontWeight:'700',color:THEME.gold,letterSpacing:2,marginBottom:2},headerTitle:{fontSize:22,fontWeight:'800',color:THEME.textPrimary},
    statsBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingVertical:12},statsText:{fontSize:13,color:THEME.textSecondary,fontWeight:'500'},
    centered:{flex:1,justifyContent:'center',alignItems:'center'},loadingText:{marginTop:12,color:THEME.textSecondary,fontSize:14},
    listContent:{paddingHorizontal:16,paddingBottom:100},listContentEmpty:{flex:1},
    row:{backgroundColor:THEME.bgCard,borderRadius:14,marginBottom:12,overflow:'hidden',borderWidth:1,borderColor:THEME.border},
    rowBody:{flexDirection:'row',alignItems:'center',paddingVertical:14,paddingHorizontal:16,gap:10},rowInfo:{flex:1},
    rowName:{fontSize:16,fontWeight:'700',color:THEME.textPrimary,marginBottom:4},rowMeta:{flexDirection:'row',alignItems:'center',gap:8,marginTop:4},
    badge:{borderRadius:6,paddingHorizontal:8,paddingVertical:3},badgeText:{fontSize:12,fontWeight:'600'},subText:{fontSize:12,color:THEME.textSecondary,marginBottom:2},
    rowActions:{flexDirection:'column',gap:6},actionBtn:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:6,borderRadius:8,minWidth:70,justifyContent:'center'},
    updateBtn:{backgroundColor:THEME.goldLight},deleteBtn:{backgroundColor:THEME.dangerBg},actionText:{fontSize:12,fontWeight:'700'},
    emptyContainer:{flex:1,justifyContent:'center',alignItems:'center',paddingTop:80},emptyTitle:{fontSize:20,fontWeight:'700',color:THEME.textPrimary,marginTop:16},emptySub:{fontSize:14,color:THEME.textSecondary,marginTop:6,textAlign:'center'},
    fab:{position:'absolute',bottom:28,right:24,width:60,height:60,borderRadius:30,backgroundColor:THEME.gold,justifyContent:'center',alignItems:'center',shadowColor:THEME.gold,shadowOffset:{width:0,height:6},shadowOpacity:0.5,shadowRadius:14,elevation:12},
    modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.65)',justifyContent:'center',alignItems:'center'},modalContent:{backgroundColor:'rgba(20,20,40,0.95)',borderRadius:20,padding:24,width:'80%',borderWidth:1,borderColor:THEME.border},
    modalTitle:{fontSize:18,fontWeight:'700',color:THEME.textPrimary,marginBottom:16,textAlign:'center'},
    modalCancel:{paddingVertical:12,marginTop:4},modalCancelText:{fontSize:15,fontWeight:'600',color:THEME.textSecondary,textAlign:'center'},
    label:{fontSize:13,fontWeight:'600',color:THEME.textPrimary,marginBottom:6,marginTop:12},
    input:{backgroundColor:THEME.bgInput,padding:14,borderRadius:12,borderWidth:1,borderColor:THEME.border,fontSize:15,color:THEME.textPrimary},
    submitBtn:{backgroundColor:THEME.gold,padding:15,borderRadius:12,marginTop:20,alignItems:'center',shadowColor:THEME.gold,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8,elevation:6},submitBtnText:{color:'#fff',fontSize:16,fontWeight:'700'},
});

export default SupplierManagementScreen;
