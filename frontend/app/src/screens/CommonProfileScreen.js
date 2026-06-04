import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../api/client';        // ← same as DoctorAvailabilityScreen
import Toast from 'react-native-toast-message'; // ← same as DoctorAvailabilityScreen

const ProfileScreen = () => {
    const { user, logout } = useAuth();

    const isDoctor = user?.role?.toLowerCase() === 'doctor';

    // ── State (same pattern as DoctorAvailabilityScreen) ────────────────────
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Fetch doctor details ─────────────────────────────────────────────────
    const fetchDoctorDetails = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await apiClient.get(`/doctor/profile/${user?._id}`);
            if (response.data) {
                // handle both { data: {...} } and flat response shapes
                const data = response.data.data || response.data;
                setDoctorProfile(data);
            }
        } catch (error) {
            console.error('Fetch doctor profile error:', error);
            Toast.show({ type: 'error', text1: 'Failed to load doctor profile' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isDoctor) fetchDoctorDetails();
    }, []);

    // ── Logout ───────────────────────────────────────────────────────────────
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]
        );
    };

    // ── Menu option ──────────────────────────────────────────────────────────
    const MenuOption = ({ icon, label, onPress, color = colors.text }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
                    <MaterialCommunityIcons name={icon} size={22} color={color} />
                </View>
                <Text style={[styles.menuLabel, { color }]}>{label}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.border} />
        </TouchableOpacity>
    );

    // ── Doctor detail row ────────────────────────────────────────────────────
    const DoctorDetailRow = ({ icon, label, value }) => {
        if (!value) return null;
        return (
            <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                    <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.detailTextWrap}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailValue}>{value}</Text>
                </View>
            </View>
        );
    };

    // ── Doctor professional card ─────────────────────────────────────────────
    const DoctorProfessionalCard = () => {
        const d = doctorProfile;
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Professional Information</Text>
                <Card style={styles.doctorCard}>

                    {/* Header banner */}
                    <View style={styles.doctorCardHeader}>
                        <View style={styles.doctorBadgeRow}>
                            <MaterialCommunityIcons name="stethoscope" size={16} color={colors.white} />
                            <Text style={styles.doctorBadgeText}>Verified Doctor</Text>
                        </View>
                        <Text style={styles.doctorCardName}>{d?.name || 'Dr. Name'}</Text>
                        <Text style={styles.doctorCardSpec}>
                            {d?.specialization || 'Specialization not set'}
                        </Text>
                    </View>

                    {/* Detail rows */}
                    <View style={styles.detailList}>
                        <View style={styles.detailDivider} />
                        <DoctorDetailRow
                            icon="school-outline"
                            label="Degree"
                            value={d?.degree}
                        />
                        <View style={styles.detailDivider} />
                        <DoctorDetailRow
                            icon="medical-bag"
                            label="Specialization"
                            value={d?.specialization}
                        />
                        <View style={styles.detailDivider} />
                        <DoctorDetailRow
                            icon="briefcase-clock-outline"
                            label="Experience"
                            value={d?.experience ? `${d.experience} years` : undefined}
                        />
                        <View style={styles.detailDivider} />
                        <DoctorDetailRow
                            icon="card-account-details-outline"
                            label="Licence Number"
                            value={d?.licenceNumber}
                        />
                    </View>

                    {/* Bio / Description */}
                    {d?.description ? (
                        <View style={styles.doctorBioWrap}>
                            <View style={styles.detailDivider} />
                            <View style={styles.doctorBioInner}>
                                <MaterialCommunityIcons
                                    name="text-account"
                                    size={18}
                                    color={colors.primary}
                                    style={{ marginTop: 2 }}
                                />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.detailLabel}>About</Text>
                                    <Text style={styles.doctorBioText}>{d.description}</Text>
                                </View>
                            </View>
                        </View>
                    ) : null}

                </Card>
            </View>
        );
    };

    // ── Loading spinner — same as DoctorAvailabilityScreen ───────────────────
    if (isDoctor && loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // ── Main render ──────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    isDoctor ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchDoctorDetails(true)}
                            colors={[colors.primary]}
                        />
                    ) : undefined
                }
            >
                {/* Avatar / name header */}
                <View style={styles.header}>
                    <View style={[
                        styles.avatarContainer,
                        isDoctor && styles.avatarContainerDoctor,
                    ]}>
                        <MaterialCommunityIcons
                            name={isDoctor ? 'doctor' : 'account'}
                            size={60}
                            color={colors.primary}
                        />
                    </View>
                    <Text style={styles.name}>{user?.name || 'User Name'}</Text>
                    <Text style={[
                        styles.roleText,
                        isDoctor && styles.roleTextDoctor,
                    ]}>
                        {user?.role?.toUpperCase() || 'PATIENT'}
                    </Text>
                    <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
                </View>

                {/* Doctor professional card — only for doctors */}
                {isDoctor && doctorProfile && <DoctorProfessionalCard />}

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    <Card style={styles.menuCard}>
                        <MenuOption icon="account-edit-outline" label="Edit Profile" onPress={() => { }} />
                        <View style={styles.divider} />
                        <MenuOption icon="shield-lock-outline" label="Security" onPress={() => { }} />
                        <View style={styles.divider} />
                        <MenuOption icon="bell-outline" label="Notifications" onPress={() => { }} />
                    </Card>
                </View>

                {/* Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <Card style={styles.menuCard}>
                        <MenuOption icon="help-circle-outline" label="Help Center" onPress={() => { }} />
                        <View style={styles.divider} />
                        <MenuOption icon="file-document-outline" label="Privacy Policy" onPress={() => { }} />
                    </Card>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>App Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
    avatarContainer: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16, borderWidth: 2, borderColor: colors.white,
        elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4,
    },
    avatarContainerDoctor: { borderWidth: 3, borderColor: colors.primary },
    name: { fontSize: 22, fontWeight: 'bold', color: colors.text },
    roleText: {
        fontSize: 12, fontWeight: 'bold', color: colors.primary,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 4, marginTop: 4,
    },
    roleTextDoctor: { color: colors.white, backgroundColor: colors.primary },
    email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

    // Sections
    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 16, fontWeight: 'bold',
        color: colors.text, marginBottom: 12, marginLeft: 4,
    },

    // Doctor card
    doctorCard: {
        padding: 0, overflow: 'hidden',
        borderWidth: 1, borderColor: colors.primaryLight,
    },
    doctorCardHeader: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20,
    },
    doctorBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    doctorBadgeText: {
        color: colors.white, fontSize: 11, fontWeight: '700',
        marginLeft: 6, opacity: 0.9, letterSpacing: 0.5, textTransform: 'uppercase',
    },
    doctorCardName: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
    doctorCardSpec: { color: colors.white, fontSize: 13, opacity: 0.85, marginTop: 2 },

    // Detail rows
    detailList: { paddingHorizontal: 4, paddingTop: 4 },
    detailRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingVertical: 12, paddingHorizontal: 16,
    },
    detailIconWrap: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12, marginTop: 2,
    },
    detailTextWrap: { flex: 1 },
    detailLabel: {
        fontSize: 11, color: colors.textSecondary,
        textTransform: 'uppercase', letterSpacing: 0.5,
        fontWeight: '600', marginBottom: 2,
    },
    detailValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
    detailDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },

    // Bio
    doctorBioWrap: { paddingHorizontal: 4 },
    doctorBioInner: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingVertical: 12, paddingHorizontal: 16,
    },
    doctorBioText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

    // Stats
    statsStrip: {
        flexDirection: 'row',
        borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4,
    },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statDivider: { width: 1, backgroundColor: colors.border },
    statNumber: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

    // Menu card
    menuCard: { padding: 0, overflow: 'hidden' },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', padding: 16,
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    menuIcon: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    menuLabel: { fontSize: 16, fontWeight: '500' },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },

    // Logout
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.white,
        padding: 16, borderRadius: 12, marginTop: 8,
        borderWidth: 1, borderColor: '#FEE2E2',
    },
    logoutText: { color: colors.error, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    version: {
        textAlign: 'center', color: colors.textSecondary,
        fontSize: 12, marginTop: 32, marginBottom: 20,
    },
});

export default ProfileScreen;










// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { colors } from '../theme/colors';
// import { useAuth } from '../context/AuthContext';
// import Card from '../components/Card';
// import { MaterialCommunityIcons } from '@expo/vector-icons';

// const ProfileScreen = () => {
//     const { user, logout } = useAuth();

//     const handleLogout = () => {
//         Alert.alert(
//             'Logout',
//             'Are you sure you want to log out?',
//             [
//                 { text: 'Cancel', style: 'cancel' },
//                 { text: 'Logout', style: 'destructive', onPress: logout },
//             ]
//         );
//     };

//     const MenuOption = ({ icon, label, onPress, color = colors.text }) => (
//         <TouchableOpacity style={styles.menuItem} onPress={onPress}>
//             <View style={styles.menuLeft}>
//                 <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
//                     <MaterialCommunityIcons name={icon} size={22} color={color} />
//                 </View>
//                 <Text style={[styles.menuLabel, { color }]}>{label}</Text>
//             </View>
//             <MaterialCommunityIcons name="chevron-right" size={24} color={colors.border} />
//         </TouchableOpacity>
//     );

//     return (
//         <View style={styles.container}>
//             <ScrollView contentContainerStyle={styles.scrollContent}>
//                 <View style={styles.header}>
//                     <View style={styles.avatarContainer}>
//                         <MaterialCommunityIcons name="account" size={60} color={colors.primary} />
//                     </View>
//                     <Text style={styles.name}>{user?.name || 'User Name'}</Text>
//                     <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'PATIENT'}</Text>
//                     <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
//                 </View>

//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>Account Settings</Text>
//                     <Card style={styles.menuCard}>
//                         <MenuOption icon="account-edit-outline" label="Edit Profile" onPress={() => { }} />
//                         <View style={styles.divider} />
//                         <MenuOption icon="shield-lock-outline" label="Security" onPress={() => { }} />
//                         <View style={styles.divider} />
//                         <MenuOption icon="bell-outline" label="Notifications" onPress={() => { }} />
//                     </Card>
//                 </View>

//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>Support</Text>
//                     <Card style={styles.menuCard}>
//                         <MenuOption icon="help-circle-outline" label="Help Center" onPress={() => { }} />
//                         <View style={styles.divider} />
//                         <MenuOption icon="file-document-outline" label="Privacy Policy" onPress={() => { }} />
//                     </Card>
//                 </View>

//                 <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//                     <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
//                     <Text style={styles.logoutText}>Log Out</Text>
//                 </TouchableOpacity>

//                 <Text style={styles.version}>App Version 1.0.0</Text>
//             </ScrollView>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: colors.background,
//     },
//     scrollContent: {
//         padding: 20,
//     },
//     header: {
//         alignItems: 'center',
//         marginBottom: 32,
//         marginTop: 20,
//     },
//     avatarContainer: {
//         width: 100,
//         height: 100,
//         borderRadius: 50,
//         backgroundColor: colors.primaryLight,
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginBottom: 16,
//         borderWidth: 2,
//         borderColor: colors.white,
//         elevation: 4,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//     },
//     name: {
//         fontSize: 22,
//         fontWeight: 'bold',
//         color: colors.text,
//     },
//     roleText: {
//         fontSize: 12,
//         fontWeight: 'bold',
//         color: colors.primary,
//         backgroundColor: colors.primaryLight,
//         paddingHorizontal: 8,
//         paddingVertical: 2,
//         borderRadius: 4,
//         marginTop: 4,
//     },
//     email: {
//         fontSize: 14,
//         color: colors.textSecondary,
//         marginTop: 4,
//     },
//     section: {
//         marginBottom: 24,
//     },
//     sectionTitle: {
//         fontSize: 16,
//         fontWeight: 'bold',
//         color: colors.text,
//         marginBottom: 12,
//         marginLeft: 4,
//     },
//     menuCard: {
//         padding: 0,
//         overflow: 'hidden',
//     },
//     menuItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         padding: 16,
//     },
//     menuLeft: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     menuIcon: {
//         width: 36,
//         height: 36,
//         borderRadius: 10,
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginRight: 12,
//     },
//     menuLabel: {
//         fontSize: 16,
//         fontWeight: '500',
//     },
//     divider: {
//         height: 1,
//         backgroundColor: colors.border,
//         marginHorizontal: 16,
//     },
//     logoutButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: colors.white,
//         padding: 16,
//         borderRadius: 12,
//         marginTop: 8,
//         borderWidth: 1,
//         borderColor: '#FEE2E2',
//     },
//     logoutText: {
//         color: colors.error,
//         fontSize: 16,
//         fontWeight: 'bold',
//         marginLeft: 8,
//     },
//     version: {
//         textAlign: 'center',
//         color: colors.textSecondary,
//         fontSize: 12,
//         marginTop: 32,
//         marginBottom: 20,
//     },
// });

// export default ProfileScreen;