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

const AdminUsersScreen = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'Patient', 'Doctor', 'Admin'];

    const fetchUsers = async (isRefreshing = false) => {
        try {
            if (isRefreshing) setRefreshing(true);
            else setLoading(true);

            const response = await apiClient.get('/admin/users');
            setUsers(response.data || []);
        } catch (error) {
            console.error('Fetch admin users error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch users';
            Toast.show({ type: 'error', text1: 'Error', text2: errorMessage });

            // Fallback for demo/testing if backend is not ready
            // setUsers([
            //     { _id: '1', name: 'Admin User', email: 'admin@hospital.com', role: 'admin', createdAt: '2024-01-10T10:00:00Z' },
            //     { _id: '2', name: 'Dr. Sarah Adams', email: 'sarah@hospital.com', role: 'doctor', createdAt: '2024-02-15T14:30:00Z' },
            //     { _id: '3', name: 'Sohail Dad', email: 'sohail@example.com', role: 'patient', createdAt: '2024-03-20T09:15:00Z' },
            //     { _id: '4', name: 'Jane Doe', email: 'jane@example.com', role: 'patient', createdAt: '2024-04-05T11:45:00Z' },
            // ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = (id, role) => {
        if (role === 'admin') {
            Alert.alert('Action Denied', 'You cannot delete another admin.');
            return;
        }

        Alert.alert(
            'Delete User',
            'Are you sure you want to remove this user from the system?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/admin/users/${id}`);
                            Toast.show({ type: 'success', text1: 'User deleted' });
                            fetchUsers();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Toast.show({ type: 'error', text1: 'Failed to delete user' });
                        }
                    }
                }
            ]
        );
    };

    const handleChangeRole = (id, currentRole) => {
        if (currentRole === 'admin') {
            Alert.alert('Action Denied', 'You cannot change the role of another admin.');
            return;
        }

        const newRole = currentRole === 'patient' ? 'doctor' : 'patient';
        const roleName = newRole.charAt(0).toUpperCase() + newRole.slice(1);

        Alert.alert(
            'Change Role',
            `Change this user to a ${roleName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: `Make ${roleName}`,
                    onPress: () => confirmChangeRole(id, newRole)
                }
            ]
        );
    };

    const confirmChangeRole = async (id, newRole) => {
        try {
            await apiClient.patch(`/admin/users/${id}/role`, { role: newRole });
            Toast.show({ type: 'success', text1: 'Role updated successfully' });
            fetchUsers();
        } catch (error) {
            console.error('Change role error:', error);
            Toast.show({ type: 'error', text1: 'Failed to update role' });

            // For demo/testing if backend is not ready, update local state
            setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u));
        }
    };

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'error';
            case 'doctor': return 'primary';
            case 'patient': return 'warning';
            default: return 'primary';
        }
    };

    const filteredUsers = users.filter(user => {
        if (activeFilter === 'All') return true;
        return user.role?.toLowerCase() === activeFilter.toLowerCase();
    });

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </View>
                <View style={styles.infoColumn}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={styles.statusColumn}>
                    <Badge
                        text={item.role?.toUpperCase()}
                        type={getRoleColor(item.role)}
                    />
                    <View style={styles.actionsRow}>
                        {item.role !== 'admin' && (
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleChangeRole(item._id, item.role)}
                            >
                                <MaterialCommunityIcons name="account-edit-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                        {item.role !== 'admin' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { marginLeft: 8 }]}
                                onPress={() => handleDelete(item._id, item.role)}
                            >
                                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="identifier" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>ID: {item._id.substring(0, 8)}</Text>
                </View>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>
                        Joined: {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
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
                    <Text style={styles.loaderText}>Fetching users...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onRefresh={() => fetchUsers(true)}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <EmptyState
                            icon="account-group"
                            title="No Users Found"
                            message="There are currently no users in the system."
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
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 20,
    },
    card: {
        marginBottom: 16,
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    infoColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    statusColumn: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 50,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    actionsRow: {
        flexDirection: 'row',
        marginTop: 4,
    },
    actionBtn: {
        padding: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: 6,
        fontSize: 12,
        color: colors.textSecondary,
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

export default AdminUsersScreen;
