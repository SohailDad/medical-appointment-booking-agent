import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const AdminAppointmentsScreen = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'Booked', 'Completed', 'Rescheduled', 'Cancelled'];

    const fetchAppointments = async (isRefreshing = false) => {
        try {
            if (isRefreshing) setRefreshing(true);
            else setLoading(true);

            const response = await apiClient.get('/admin/appointments');
            setAppointments(response.data || []);
        } catch (error) {
            console.error('Fetch admin appointments error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch appointments';
            Toast.show({ type: 'error', text1: 'Error', text2: errorMessage });
            
            // Fallback for demo/testing if backend is not ready
            setAppointments([
                { _id: '1', appointment_id: 'APT1001', doctor_name: 'Dr. John Smith', patient_name: 'Sohail Dad', appointment_date: '2024-05-20', appointment_time: '10:00 AM', status: 'booked', type: 'General Checkup' },
                { _id: '2', appointment_id: 'APT1002', doctor_name: 'Dr. Sarah Adams', patient_name: 'Jane Doe', appointment_date: '2024-05-22', appointment_time: '02:30 PM', status: 'booked', type: 'Follow-up' },
                { _id: '3', appointment_id: 'APT1003', doctor_name: 'Dr. Mike Ross', patient_name: 'Bob Wilson', appointment_date: '2024-05-10', appointment_time: '11:00 AM', status: 'completed', type: 'Neurology' },
                { _id: '4', appointment_id: 'APT1004', doctor_name: 'Dr. John Smith', patient_name: 'Alice Brown', appointment_date: '2024-05-25', appointment_time: '09:00 AM', status: 'rescheduled', type: 'Consultation' },
                { _id: '5', appointment_id: 'APT1005', doctor_name: 'Dr. Sarah Adams', patient_name: 'Charlie Davis', appointment_date: '2024-05-15', appointment_time: '03:00 PM', status: 'cancelled', type: 'Cardiology' },
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Appointment',
            'Are you sure you want to remove this appointment record?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/admin/appointments/${id}`);
                            Toast.show({ type: 'success', text1: 'Appointment deleted' });
                            fetchAppointments();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Toast.show({ type: 'error', text1: 'Failed to delete appointment' });
                        }
                    }
                }
            ]
        );
    };

    const filteredAppointments = appointments.filter(app => {
        if (activeFilter === 'All') return true;
        return app.status?.toLowerCase() === activeFilter.toLowerCase();
    });

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.infoColumn}>
                    <Text style={styles.appointmentId}>ID: {item.appointment_id || item._id.substring(0, 8)}</Text>
                    <Text style={styles.doctorName}>{item.doctor_name}</Text>
                    <Text style={styles.patientName}>Patient: {item.patient_name}</Text>
                </View>
                <View style={styles.statusColumn}>
                    <Badge 
                        text={item.status} 
                        type={
                            item.status === 'completed' ? 'success' : 
                            item.status === 'booked' ? 'primary' : 
                            item.status === 'rescheduled' ? 'warning' : 
                            item.status === 'cancelled' ? 'error' : 'primary'
                        } 
                    />
                    <TouchableOpacity 
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item._id)}
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
                    <Text style={styles.detailText}>{item.appointment_date}</Text>
                </View>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
                    <Text style={styles.detailText}>{item.appointment_time}</Text>
                </View>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="medical-bag" size={16} color={colors.primary} />
                    <Text style={styles.detailText}>{item.type || 'General'}</Text>
                </View>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <View style={styles.filterWrapper}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.filterContainer}
                >
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterTab,
                                activeFilter === filter && styles.activeFilterTab
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[
                                styles.filterTabText,
                                activeFilter === filter && styles.activeFilterTabText
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loaderText}>Fetching appointments...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredAppointments}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onRefresh={() => fetchAppointments(true)}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <EmptyState
                            icon="calendar-blank"
                            title="No Appointments Found"
                            message="There are currently no appointments in the system."
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    list: {
        padding: 20,
    },
    card: {
        marginBottom: 16,
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    infoColumn: {
        flex: 1,
    },
    statusColumn: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 60,
    },
    appointmentId: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '700',
        marginBottom: 4,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    patientName: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    deleteBtn: {
        padding: 5,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: 6,
        fontSize: 13,
        color: colors.text,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        color: colors.textSecondary,
        fontSize: 16,
    },
    filterWrapper: {
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    filterContainer: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeFilterTab: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    activeFilterTabText: {
        color: colors.white,
    },
});

export default AdminAppointmentsScreen;
