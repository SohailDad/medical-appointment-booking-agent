import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const DoctorAppointmentsScreen = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/doctor/appointments');
            // Filter to show only 'booked' appointments as requested
            // In the backend schema, AppointmentStatus.BOOKED = 'booked'
            const bookedAppointments = response.data.filter(app => app.status === 'booked');
            setAppointments(bookedAppointments);

        } catch (error) {
            console.error('Fetch appointments error:', error);
            // Fallback mock data with correct status and fields for testing
            setAppointments([
                { _id: '1', patient_name: 'Alice Johnson', appointment_date: '2024-05-20', appointment_time: '10:00 AM', status: 'booked' },
                { _id: '2', patient_name: 'Bob Brown', appointment_date: '2024-05-20', appointment_time: '11:30 AM', status: 'booked' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.patient_name ? item.patient_name[0] : 'P'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{item.patient_name}</Text>
                    <View style={styles.timeRow}>
                        <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                        <Text style={styles.timeText}>{item.appointment_date}</Text>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                        <Text style={styles.timeText}>{item.appointment_time}</Text>
                    </View>
                </View>
                <Badge text={item.status} type="primary" />
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={appointments}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                onRefresh={fetchAppointments}
                refreshing={loading}
                ListHeaderComponent={<Text style={styles.title}>Booked Appointments</Text>}
                ListEmptyComponent={
                    <EmptyState
                        icon="calendar-check"
                        title="No Booked Appointments"
                        message="You don't have any booked appointments yet."
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
    list: {
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 20,
    },
    card: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 20,
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    timeText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 4,
    },
});

export default DoctorAppointmentsScreen;
