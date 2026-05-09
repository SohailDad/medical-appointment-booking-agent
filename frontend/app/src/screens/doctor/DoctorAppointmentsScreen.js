import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const DoctorAppointmentsScreen = () => {
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('booked'); // 'booked' or 'completed'

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/doctor/appointments');
            setAllAppointments(response.data || []);
        } catch (error) {
            console.error('Fetch appointments error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch appointments';
            Toast.show({ type: 'error', text1: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = (id) => {
        Alert.alert(
            'Complete Appointment',
            'Mark this appointment as completed?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Completed',
                    onPress: async () => {
                        try {
                            await apiClient.patch(`/doctor/complete/${id}`);
                            Toast.show({ type: 'success', text1: 'Appointment marked as completed' });
                            fetchAppointments();
                        } catch (error) {
                            console.error('Complete error:', error);
                            const errorMessage = error.response?.data?.message || 'Failed to mark as completed';
                            Toast.show({ type: 'error', text1: errorMessage });
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const filteredAppointments = allAppointments.filter(app => app.status === activeTab);

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.patient_name ? item.patient_name[0] : 'P'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.headerRow}>
                        <Text style={styles.patientName}>{item.patient_name}</Text>
                        <Badge 
                            text={item.status} 
                            type={item.status === 'completed' ? 'success' : 'primary'} 
                        />
                    </View>
                    <Text style={styles.appointmentId}>ID: {item.appointment_id || 'N/A'}</Text>
                    <View style={styles.timeRow}>
                        <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                        <Text style={styles.timeText}>{item.appointment_date}</Text>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                        <Text style={styles.timeText}>{item.appointment_time}</Text>
                    </View>
                </View>
            </View>

            {item.status === 'booked' && (
                <>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.completedButton}
                        onPress={() => handleComplete(item._id)}
                    >
                        <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.white} />
                        <Text style={styles.completedButtonText}>Completed</Text>
                    </TouchableOpacity>
                </>
            )}
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Appointments</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'booked' && styles.activeTab]}
                        onPress={() => setActiveTab('booked')}
                    >
                        <Text style={[styles.tabText, activeTab === 'booked' && styles.activeTabText]}>Booked</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                        onPress={() => setActiveTab('completed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredAppointments}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                onRefresh={fetchAppointments}
                refreshing={loading}
                ListEmptyComponent={
                    <EmptyState
                        icon={activeTab === 'booked' ? "calendar-check" : "calendar-clock"}
                        title={activeTab === 'booked' ? "No Booked Appointments" : "No Completed Appointments"}
                        message={activeTab === 'booked' ? "You don't have any booked appointments yet." : "You haven't completed any appointments yet."}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        paddingTop: 10,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 15,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: colors.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.primary,
    },
    list: {
        padding: 20,
    },
    card: {
        marginBottom: 16,
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 22,
    },
    patientName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: colors.text,
    },
    appointmentId: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 4,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    completedButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    completedButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 15,
    },
});

export default DoctorAppointmentsScreen;
