import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const PatientHomeScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRecentAppointments = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/appointments/my'); //yaha pe moja eamil pe check krna chai q kih email aik user ka rahy ga or name change ho jaty hai.
            setAppointments(response.data.slice(0, 3)); // Just show top 3
        } catch (error) {
            console.error('Fetch appointments error', error);
            // Dummy data for demo if API fails
            // setAppointments([
            //     { _id: '1', doctorName: 'Dr. Smith', date: '2024-05-20', time: '10:00 AM', status: 'upcoming' },
            //     { _id: '2', doctorName: 'Dr. Adams', date: '2024-05-22', time: '02:30 PM', status: 'upcoming' },
            // ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRecentAppointments();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRecentAppointments();
    };

    const CategoryItem = ({ icon, label, onPress, color = colors.primary }) => (
        <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
            <View style={[styles.categoryIcon, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.categoryLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <View style={styles.avatar}>
                            <MaterialCommunityIcons name="account" size={30} color={colors.primary} />
                        </View>
                    </TouchableOpacity>
                </View>

                <Card mintBackground style={styles.promoCard}>
                    <View style={styles.promoContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.promoTitle}>Book your next appointment</Text>
                            <Text style={styles.promoSubtitle}>Find the right doctor for your symptoms</Text>
                            <TouchableOpacity
                                style={styles.promoButton}
                                onPress={() => navigation.navigate('Appointments', { screen: 'BookAppointment' })}
                            >
                                <Text style={styles.promoButtonText}>Book Now</Text>
                            </TouchableOpacity>
                        </View>
                        <MaterialCommunityIcons name="medical-bag" size={60} color={colors.primary} style={{ opacity: 0.8 }} />
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Specialties</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Chat', { message: 'Show me all medical categories' })}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.categoriesGrid}>
                    <CategoryItem icon="heart-pulse" label="Cardiology" onPress={() => navigation.navigate('Chat', { message: 'I need a cardiologist' })} color="#FF3B30" />
                    <CategoryItem icon="tooth-outline" label="Dental" onPress={() => navigation.navigate('Chat', { message: 'I need a dentist' })} color="#5856D6" />
                    <CategoryItem icon="eye-outline" label="Eye Care" onPress={() => navigation.navigate('Chat', { message: 'I need an eye specialist' })} color="#AF52DE" />
                    <CategoryItem icon="human-handsup" label="Orthopedic" onPress={() => navigation.navigate('Chat', { message: 'I need an orthopedic' })} color="#FF9500" />
                </View>
                <View style={[styles.categoriesGrid, { marginBottom: 24 }]}>
                    <CategoryItem icon="brain" label="Neurology" onPress={() => navigation.navigate('Chat', { message: 'I need a neurologist' })} color="#007AFF" />
                    <CategoryItem icon="face-man-shimmer-outline" label="Dermatology" onPress={() => navigation.navigate('Chat', { message: 'I need a dermatologist' })} color="#34C759" />
                    <CategoryItem icon="baby-face-outline" label="Pediatric" onPress={() => navigation.navigate('Chat', { message: 'I need a pediatrician' })} color="#FF2D55" />
                    <CategoryItem icon="pill" label="Pharmacy" onPress={() => navigation.navigate('Chat', { message: 'Find pharmacies nearby' })} color="#5AC8FA" />
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Appointments</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {appointments.length > 0 ? (
                    appointments.map((item) => (
                        <Card key={item._id} style={styles.appointmentCard}>
                            <View style={styles.appointmentInfo}>
                                <View style={styles.docIcon}>
                                    <MaterialCommunityIcons name="doctor" size={24} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.doctorName}>{item.doctor_name}</Text>
                                    <Text style={styles.patientName}>Patient: {item.patient_name || 'Me'}</Text>
                                    <Text style={styles.dateTime}>{item.appointment_date} • {item.appointment_time}</Text>
                                </View>
                                <Badge text={item.status} type={item.status === 'upcoming' ? 'primary' : 'success'} />
                            </View>
                        </Card>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No upcoming appointments</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoCard: {
        padding: 20,
        marginBottom: 24,
    },
    promoContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    promoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    promoSubtitle: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.7,
        marginBottom: 16,
    },
    promoButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    promoButtonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
    },
    seeAll: {
        color: colors.primary,
        fontWeight: '600',
    },
    categoriesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    categoryItem: {
        alignItems: 'center',
        width: '22%',
    },
    categoryIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryLabel: {
        fontSize: 11,
        color: colors.text,
        fontWeight: '500',
        textAlign: 'center',
    },
    appointmentCard: {
        marginBottom: 12,
        padding: 12,
    },
    appointmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    docIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    patientName: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    dateTime: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
});

export default PatientHomeScreen;
