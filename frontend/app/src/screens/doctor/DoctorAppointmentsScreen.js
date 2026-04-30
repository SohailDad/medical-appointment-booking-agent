import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const DoctorAppointmentsScreen = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            // const response = await apiClient.get('/doctor/appointments');
            // setAppointments(response.data);
            
        } catch (error) {
            setAppointments([
                { _id: '1', patientName: 'Alice Johnson', date: '2024-05-20', time: '10:00 AM', status: 'upcoming' },
                { _id: '2', patientName: 'Bob Brown', date: '2024-05-20', time: '11:30 AM', status: 'upcoming' },
            ]);
            console.error('Fetch error', error);
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
                    <Text style={styles.avatarText}>{item.patientName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{item.patientName}</Text>
                    <Text style={styles.time}>{item.date} at {item.time}</Text>
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
                ListHeaderComponent={<Text style={styles.title}>My Patients Today</Text>}
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    time: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
});

export default DoctorAppointmentsScreen;
