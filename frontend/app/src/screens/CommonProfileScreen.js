import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ProfileScreen = () => {
    const { user, logout } = useAuth();

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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <MaterialCommunityIcons name="account" size={60} color={colors.primary} />
                    </View>
                    <Text style={styles.name}>{user?.name || 'User Name'}</Text>
                    <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'PATIENT'}</Text>
                    <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
                </View>

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
        </SafeAreaView>
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
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.white,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
    },
    roleText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    email: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuCard: {
        padding: 0,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    version: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 32,
        marginBottom: 20,
    },
});

export default ProfileScreen;
