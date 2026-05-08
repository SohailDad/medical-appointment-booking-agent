import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import MintButton from '../../components/MintButton';
import EmptyState from '../../components/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const AppointmentsScreen = ({ navigation }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/appointments/my');
            setAppointments(response.data);
        } catch (error) {
            console.error('Fetch appointments error', error);

            let message = 'Something went wrong';

            if (error.response) {
                // Server responded (4xx, 5xx)
                message = error.response.data?.message || 'Server error';
            } else if (error.request) {
                // Request made but no response (network issue)
                message = 'No internet connection. Please check your network.';
            } else {
                // Other error
                message = error.message;
            }

            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: message,
            });
            // Dummy data
            setAppointments([
                { _id: '1', appointment_id: 'APT1001', doctor_name: 'Dr. John Smith', appointment_date: '2024-05-20', appointment_time: '10:00 AM', status: 'upcoming', type: 'General Checkup' },
                { _id: '2', appointment_id: 'APT1002', doctor_name: 'Dr. Sarah Adams', appointment_date: '2024-05-22', appointment_time: '02:30 PM', status: 'upcoming', type: 'Follow-up' },
                { _id: '3', appointment_id: 'APT1003', doctor_name: 'Dr. Mike Ross', appointment_date: '2024-05-10', appointment_time: '11:00 AM', status: 'completed', type: 'Dentist' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleCancel = (id) => {
        Alert.alert(
            'Cancel Appointment',
            'Are you sure you want to cancel this appointment?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.post(`/appointments/cancel/${id}`);
                            Toast.show({ type: 'success', text1: 'Appointment cancelled' });
                            fetchAppointments();
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Failed to cancel' });
                        }
                    }
                },
            ]
        );
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{item.doctor_name}</Text>
                    <Text style={styles.typeText}>{item.type} • ID: {item.appointment_id || item._id.substring(0, 8)}</Text>
                </View>
                <Badge text={item.status} type={item.status === 'upcoming' ? 'primary' : item.status === 'completed' ? 'success' : 'error'} />
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.detailText}>{item.appointment_date}</Text>
                </View>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                    <Text style={styles.detailText}>{item.appointment_time}</Text>
                </View>
            </View>

            {item.status === 'upcoming' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryAction]}
                        onPress={() => navigation.navigate('Chat', { 
                            message: `I want to reschedule my appointment with ${item.doctor_name} (ID: ${item.appointment_id || item._id.substring(0, 8)})` 
                        })}
                    >
                        <Text style={styles.secondaryActionText}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.dangerAction]}
                        onPress={() => navigation.navigate('Chat', { 
                            message: `I want to cancel my appointment with ${item.doctor_name} (ID: ${item.appointment_id || item._id.substring(0, 8)})` 
                        })}
                    >
                        <Text style={styles.dangerActionText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <FlatList
                    data={appointments}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onRefresh={fetchAppointments}
                    refreshing={loading}
                    ListEmptyComponent={
                        <EmptyState
                            icon="calendar-blank"
                            title="No Appointments"
                            message="You haven't booked any appointments yet."
                            buttonTitle="Book Now"
                            onButtonPress={() => navigation.navigate('Chat', { message: 'I want to book a new appointment' })}
                        />
                    }
                />
                <View style={styles.footer}>
                    <MintButton
                        title="Book New Appointment"
                        onPress={() => navigation.navigate('Chat', { message: 'I want to book a new appointment' })}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    typeText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: colors.text,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    secondaryAction: {
        backgroundColor: colors.primaryLight,
    },
    secondaryActionText: {
        color: colors.primary,
        fontWeight: '600',
    },
    dangerAction: {
        backgroundColor: '#FEE2E2',
    },
    dangerActionText: {
        color: colors.error,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
});

export default AppointmentsScreen;
