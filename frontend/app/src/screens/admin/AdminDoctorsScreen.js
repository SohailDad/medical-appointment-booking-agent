import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    ScrollView,
    Platform,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import MintButton from '../../components/MintButton';
import FormInput from '../../components/FormInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

// Days cycle for availability slots
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminDoctorsScreen = ({ navigation }) => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [availabilitySlots, setAvailabilitySlots] = useState([]);
    const [slotErrors, setSlotErrors] = useState([]);

    const {
        control,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm();

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/doctors');
            setDoctors(response.data);
        } catch (error) {
            console.error('Fetch doctors error', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load doctors' });
            // Dummy data fallback
            setDoctors([
                {
                    _id: '1',
                    name: 'Dr. Sarah Adams',
                    email: 'sarah@hospital.com',
                    specialization: 'Cardiology',
                    experience: 8,
                    degree: 'MBBS, FCPS',
                    licenceNumber: 'PMC-12345',
                    description: 'Expert in cardiovascular medicine.',
                    availability: [{ day: 'Monday', startTime: '09:00', endTime: '17:00' }, { day: 'Tuesday', startTime: '10:00', endTime: '16:00' }, { day: 'Wednesday', startTime: '10:00', endTime: '16:00' },],
                },
                {
                    _id: '2',
                    name: 'Dr. Mike Ross',
                    email: 'mike@hospital.com',
                    specialization: 'Neurology',
                    experience: 12,
                    degree: 'MBBS, MRCP',
                    licenceNumber: 'PMC-67890',
                    description: 'Specialist in neurological disorders.',
                    availability: [{ day: 'Wednesday', startTime: '10:00', endTime: '16:00' }],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    // ── Modal helpers ──────────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingDoctor(null);
        setAvailabilitySlots([]);
        setSlotErrors([]);
        // ✅ FIX 1: Added degree and licenceNumber to reset
        reset({ name: '', email: '', specialization: '', experience: '', description: '', degree: '', licenceNumber: '' });
        setModalVisible(true);
    };

    const openEditModal = (doctor) => {
        setEditingDoctor(doctor);
        setAvailabilitySlots(doctor.availability ? doctor.availability.map(s => ({ ...s })) : []);
        setSlotErrors(doctor.availability ? doctor.availability.map(() => ({ startTime: '', endTime: '' })) : []);
        // ✅ FIX 2: Added degree and licenceNumber to reset
        reset({
            name: doctor.name || '',
            email: doctor.email || '',
            specialization: doctor.specialization || '',
            experience: doctor.experience != null ? String(doctor.experience) : '',
            description: doctor.description || '',
            degree: doctor.degree || '',
            licenceNumber: doctor.licenceNumber || '',
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingDoctor(null);
        setAvailabilitySlots([]);
        setSlotErrors([]);
        // ✅ FIX 3: Added degree and licenceNumber to reset
        reset({ name: '', email: '', specialization: '', experience: '', description: '', degree: '', licenceNumber: '' });
    };

    // ── Availability slot management ───────────────────────────────────────────
    const addSlot = () => {
        setAvailabilitySlots(prev => [...prev, { day: 'Monday', startTime: '09:00', endTime: '17:00' }]);
        setSlotErrors(prev => [...prev, { startTime: '', endTime: '' }]);
    };

    const removeSlot = (index) => {
        setAvailabilitySlots(prev => prev.filter((_, i) => i !== index));
        setSlotErrors(prev => prev.filter((_, i) => i !== index));
    };

    const cycleDayForSlot = (index) => {
        setAvailabilitySlots(prev => {
            const updated = [...prev];
            const current = DAYS.indexOf(updated[index].day);
            updated[index] = { ...updated[index], day: DAYS[(current + 1) % DAYS.length] };
            return updated;
        });
    };

    const updateSlotField = (index, field, value) => {
        setAvailabilitySlots(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });

        // Clear error when user starts typing
        setSlotErrors(prev => {
            const updated = [...prev];
            if (!updated[index]) updated[index] = { startTime: '', endTime: '' };
            updated[index] = { ...updated[index], [field]: '' };
            return updated;
        });
    };

    const validateSlots = () => {
        const errors = availabilitySlots.map(slot => ({
            startTime: slot.startTime?.trim() ? '' : 'Start time is required',
            endTime: slot.endTime?.trim() ? '' : 'End time is required',
        }));
        setSlotErrors(errors);
        return !errors.some(error => error.startTime || error.endTime);
    };

    // ── Save (Add / Update) ────────────────────────────────────────────────────
    const onSubmit = async (data) => {
        try {
            if (!validateSlots()) {
                return;
            }

            // ✅ FIX 4: Added degree and licenceNumber to payload
            const payload = {
                name: data.name.trim(),
                email: data.email.trim(),
                specialization: data.specialization.trim(),
                degree: data.degree.trim(),
                licenceNumber: data.licenceNumber.trim(),
                experience: Number(data.experience),
                description: data.description.trim(),
                availability: availabilitySlots,
            };

            if (editingDoctor) {
                await apiClient.put(`/admin/doctors/${editingDoctor._id}`, payload);
                Toast.show({ type: 'success', text1: 'Doctor updated successfully' });
            } else {
                await apiClient.post('/admin/doctors', payload);
                Toast.show({ type: 'success', text1: 'Doctor added successfully' });
            }
            closeModal();
            fetchDoctors();
        } catch (error) {

            const message =
                error?.response?.data?.message ||
                (editingDoctor ? 'Failed to update doctor' : 'Failed to add doctor');
            Toast.show({ type: 'error', text1: 'Error', text2: message });
            console.error('Save doctor error:', error);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = (doctor) => {
        Alert.alert(
            'Remove Doctor',
            `Are you sure you want to remove ${doctor.name}? This may affect existing appointments.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/admin/doctors/${doctor._id}`);
                            Toast.show({ type: 'success', text1: `${doctor.name} removed` });
                            fetchDoctors();
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Delete failed' });
                        }
                    },
                },
            ]
        );
    };

    // ── Doctor card ────────────────────────────────────────────────────────────
    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.name ? item.name.charAt(0).toUpperCase() : 'D'}
                    </Text>
                </View>
                <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{item.name}</Text>
                    <Text style={styles.specialization}>{item.specialization}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => openEditModal(item)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleDelete(item)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="briefcase-outline" size={18} color={colors.primary} />
                    <Text style={styles.detailText}>{item.experience} yrs exp</Text>
                </View>
                {item.degree ? (
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="school-outline" size={18} color={colors.primary} />
                        <Text style={styles.detailText}>{item.degree}</Text>
                    </View>
                ) : null}
                <Badge
                    text={item.specialization || 'General'}
                    type="primary"
                />
            </View>

            {/* Licence Number — sits between detailsRow and description */}
            {item.licenceNumber ? (
                <View style={styles.licenceRow}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.licenceText}>Licence: {item.licenceNumber}</Text>
                </View>
            ) : null}

            {/* Description */}
            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
            </View>

            {item.availability && item.availability.length > 0 && (
                <View style={styles.slotsRow}>
                    {item.availability.slice(0, 3).map((slot, i) => (
                        <View key={i} style={styles.slotBadge}>
                            <Text style={styles.slotBadgeText}>
                                {slot.day?.substring(0, 3)}  {slot.startTime}–{slot.endTime}
                            </Text>
                        </View>
                    ))}
                    {item.availability.length > 3 && (
                        <View style={styles.slotBadge}>
                            <Text style={styles.slotBadgeText}>+{item.availability.length - 3} more</Text>
                        </View>
                    )}
                </View>
            )}
        </Card>
    );

    // ── Add / Edit Modal ───────────────────────────────────────────────────────
    const renderModal = () => (
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={closeModal}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                        </Text>
                        <TouchableOpacity
                            onPress={closeModal}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* Basic Fields via react-hook-form */}
                        <FormInput
                            control={control}
                            name="name"
                            label="Full Name *"
                            placeholder="e.g. Dr. John Smith"
                            autoCapitalize="words"
                            rules={{ required: 'Name is required' }}
                        />
                        <FormInput
                            control={control}
                            name="email"
                            label="Email *"
                            placeholder="doctor@hospital.com"
                            keyboardType="email-address"
                            rules={{
                                required: 'Email is required',
                                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                            }}
                        />
                        <FormInput
                            control={control}
                            name="specialization"
                            label="Specialization *"
                            placeholder="e.g. Cardiology"
                            autoCapitalize="words"
                            rules={{ required: 'Specialization is required' }}
                        />
                        <FormInput
                            control={control}
                            name="degree"
                            label="Degree *"
                            placeholder="e.g. MBBS, FCPS"
                            autoCapitalize="words"
                            rules={{ required: 'Degree is required' }}
                        />
                        <FormInput
                            control={control}
                            name="licenceNumber"
                            label="Licence *"
                            placeholder="e.g. PMC-00000"
                            autoCapitalize="characters"
                            rules={{ required: 'Licence is required' }}
                        />
                        <FormInput
                            control={control}
                            name="experience"
                            label="Years of Experience *"
                            placeholder="e.g. 10"
                            keyboardType="numeric"
                            rules={{
                                required: 'Experience is required',
                                pattern: { value: /^\d+$/, message: 'Must be a whole number' },
                            }}
                        />
                        <FormInput
                            control={control}
                            name="description"
                            label="Description *"
                            placeholder="Brief professional bio..."
                            autoCapitalize="sentences"
                            multiline
                            numberOfLines={3}
                            rules={{ required: 'Description is required' }}
                        />

                        {/* Availability Slots */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Availability Slots</Text>
                            <TouchableOpacity
                                style={styles.addSlotBtn}
                                onPress={addSlot}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
                                <Text style={styles.addSlotText}>Add Slot</Text>
                            </TouchableOpacity>
                        </View>

                        {availabilitySlots.length === 0 && (
                            <Text style={styles.noSlotsText}>No availability slots added yet.</Text>
                        )}

                        {availabilitySlots.map((slot, index) => {
                            const startError = slotErrors[index]?.startTime;
                            const endError = slotErrors[index]?.endTime;
                            return (
                                <View key={index} style={styles.slotRow}>
                                    {/* Tap to cycle day */}
                                    <TouchableOpacity
                                        style={styles.dayPicker}
                                        onPress={() => cycleDayForSlot(index)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.dayPickerText}>{slot.day?.substring(0, 3)}</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={12} color={colors.primary} />
                                    </TouchableOpacity>

                                    {/* Start time */}
                                    <View style={styles.timeField}>
                                        <Text style={styles.timeLabel}>From</Text>
                                        <TextInput
                                            style={[styles.timeInput, startError ? styles.timeInputError : null]}
                                            placeholder="09:00"
                                            placeholderTextColor={colors.textSecondary}
                                            value={slot.startTime}
                                            keyboardType="numbers-and-punctuation"
                                            onChangeText={(v) => updateSlotField(index, 'startTime', v)}
                                        />
                                        {startError ? <Text style={styles.slotErrorText}>{startError}</Text> : null}
                                    </View>

                                    {/* End time */}
                                    <View style={styles.timeField}>
                                        <Text style={styles.timeLabel}>To</Text>
                                        <TextInput
                                            style={[styles.timeInput, endError ? styles.timeInputError : null]}
                                            placeholder="17:00"
                                            placeholderTextColor={colors.textSecondary}
                                            value={slot.endTime}
                                            keyboardType="numbers-and-punctuation"
                                            onChangeText={(v) => updateSlotField(index, 'endTime', v)}
                                        />
                                        {endError ? <Text style={styles.slotErrorText}>{endError}</Text> : null}
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => removeSlot(index)}
                                        style={styles.removeSlotBtn}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="minus-circle" size={22} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}

                        {availabilitySlots.length > 0 && (
                            <Text style={styles.slotHint}>Tap the day badge to cycle through days.</Text>
                        )}

                        {/* Action buttons */}
                        <View style={styles.modalButtons}>
                            <MintButton
                                title="Cancel"
                                variant="secondary"
                                onPress={closeModal}
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <MintButton
                                title={editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                                onPress={handleSubmit(onSubmit)}
                                loading={isSubmitting}
                                style={{ flex: 1, marginLeft: 8 }}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // ── Main render ────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <View style={styles.content}>
                <FlatList
                    data={doctors}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onRefresh={fetchDoctors}
                    refreshing={loading}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.subtitle}>
                                {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} registered
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        !loading && (
                            <EmptyState
                                icon="doctor"
                                title="No Doctor Found"
                                message="Tap 'Add New Doctor' below to register the first doctor."
                            />
                        )
                    }
                />
                <View style={styles.footer}>
                    <MintButton title="Add New Doctor" onPress={openAddModal} />
                </View>
            </View>

            {renderModal()}
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
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 100,
    },
    listHeader: {
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    card: {
        marginBottom: 16,
    },
    cardHeader: {
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
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    specialization: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    email: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
    cardActions: {
        flexDirection: 'row',
        marginLeft: 8,
    },
    iconBtn: {
        padding: 6,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',        // ← allows items to wrap to next line
    gap: 8, 
        marginBottom: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    detailText: {
        marginLeft: 6,
        fontSize: 14,
        color: colors.text,
        flexShrink: 1,
    },
    slotsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    slotBadge: {
        backgroundColor: colors.primaryLight,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    slotBadgeText: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    // ── Modal ──────────────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '92%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    addSlotBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    addSlotText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '600',
    },
    noSlotsText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 8,
        marginBottom: 8,
        gap: 6,
    },
    dayPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 8,
        minWidth: 48,
        justifyContent: 'center',
    },
    dayPickerText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 12,
        marginRight: 2,
    },
    timeField: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 2,
        marginLeft: 4,
    },
    timeInput: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.text,
    },
    timeInputError: {
        borderColor: colors.error,
    },
    slotErrorText: {
        color: colors.error,
        fontSize: 11,
        marginTop: 4,
        marginLeft: 4,
    },
    removeSlotBtn: {
        padding: 4,
    },
    slotHint: {
        fontSize: 11,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 16,
    },

    // Description
    descriptionContainer: {
        marginVertical: 10,
    },
    descriptionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 13,
        color: colors.text,
        lineHeight: 18,
    },
    licenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 4,
        paddingHorizontal: 2,
    },
    licenceText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 6,
        fontWeight: '500',
    },
});

export default AdminDoctorsScreen;