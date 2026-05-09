import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';
import MintButton from '../../components/MintButton';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorAvailabilityScreen = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const fetchAvailability = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await apiClient.get('/doctor/availability');
            
            if (response.data) {
                const data = response.data.data || response.data.availability || response.data;
                
                if (Array.isArray(data)) {
                    setSlots(data);
                } else if (data && data.workingDays) {
                    const simpleSlots = data.workingDays.split(',').map(day => ({
                        day: day.trim(),
                        startTime: data.startTime || '09:00 AM',
                        endTime: data.endTime || '05:00 PM'
                    }));
                    setSlots(simpleSlots);
                } else {
                    setSlots([]);
                }
                setIsDirty(false);
            }
        } catch (error) {
            console.error('Fetch availability error:', error);
            Toast.show({ type: 'error', text1: 'Failed to load availability' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, []);

    const addSlot = () => {
        setSlots(prev => [...prev, { day: 'Monday', startTime: '09:00 AM', endTime: '05:00 PM' }]);
        setIsDirty(true);
    };

    const removeSlot = (index) => {
        setSlots(prev => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const updateSlotField = (index, field, value) => {
        setSlots(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
        setIsDirty(true);
    };

    const cycleDay = (index) => {
        setSlots(prev => {
            const updated = [...prev];
            const currentDayIndex = DAYS.indexOf(updated[index].day);
            const nextDayIndex = currentDayIndex === -1 ? 0 : (currentDayIndex + 1) % DAYS.length;
            updated[index].day = DAYS[nextDayIndex];
            return updated;
        });
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (slots.length === 0) {
            Alert.alert('Empty Schedule', 'Please add at least one availability slot.');
            return;
        }

        try {
            setIsSaving(true);
            await apiClient.put('/doctor/availability', { availability: slots });
            Toast.show({ type: 'success', text1: 'Schedule saved successfully' });
            setIsDirty(false);
            fetchAvailability(true);
        } catch (error) {
            console.error('Save error:', error);
            Toast.show({ type: 'error', text1: 'Failed to save schedule' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Manage Availability</Text>
                    <TouchableOpacity style={styles.addButton} onPress={addSlot} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
                        <Text style={styles.addButtonText}>Add Slot</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Set your weekly working hours and breaks</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchAvailability(true)}
                        colors={[colors.primary]}
                    />
                }
            >
                {slots.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <MaterialCommunityIcons name="calendar-clock" size={60} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>No Availability Set</Text>
                        <Text style={styles.emptySubtitle}>You haven't added any working slots yet. Tap 'Add Slot' to start.</Text>
                        <MintButton 
                            title="Add Your First Slot" 
                            onPress={addSlot} 
                            style={{ marginTop: 24, width: '70%' }}
                        />
                    </View>
                ) : (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Working Slots</Text>
                            <Text style={styles.slotCount}>{slots.length} {slots.length === 1 ? 'slot' : 'slots'} defined</Text>
                        </View>

                        {slots.map((slot, index) => (
                            <View key={index} style={styles.slotCard}>
                                <View style={styles.slotHeader}>
                                    <TouchableOpacity 
                                        style={styles.dayBadge} 
                                        onPress={() => cycleDay(index)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
                                        <Text style={styles.dayBadgeText}>{slot.day}</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={14} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => removeSlot(index)}
                                        style={styles.deleteButton}
                                    >
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.timeContainer}>
                                    <View style={styles.timeInputBox}>
                                        <Text style={styles.timeLabel}>Start Time</Text>
                                        <View style={styles.inputWrapper}>
                                            <MaterialCommunityIcons name="clock-start" size={18} color={colors.textSecondary} />
                                            <TextInput
                                                style={styles.timeInput}
                                                value={slot.startTime}
                                                placeholder="09:00 AM"
                                                onChangeText={(v) => updateSlotField(index, 'startTime', v)}
                                            />
                                        </View>
                                    </View>
                                    
                                    <View style={styles.timeSeparator}>
                                        <View style={styles.separatorLine} />
                                    </View>

                                    <View style={styles.timeInputBox}>
                                        <Text style={styles.timeLabel}>End Time</Text>
                                        <View style={styles.inputWrapper}>
                                            <MaterialCommunityIcons name="clock-end" size={18} color={colors.textSecondary} />
                                            <TextInput
                                                style={styles.timeInput}
                                                value={slot.endTime}
                                                placeholder="05:00 PM"
                                                onChangeText={(v) => updateSlotField(index, 'endTime', v)}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                        
                        <View style={styles.footer}>
                            <Text style={styles.hintText}>
                                <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={colors.warning} />
                                {' '}Tip: Tap the day badge to quickly cycle through days of the week.
                            </Text>
                            <MintButton 
                                title={isDirty ? "Save All Changes" : "Schedule Saved"}
                                onPress={handleSave} 
                                loading={isSaving}
                                style={[
                                    styles.saveButton, 
                                    !isDirty && { backgroundColor: '#E5E7EB' } 
                                ]}
                                textStyle={!isDirty && { color: colors.textSecondary }}
                                disabled={!isDirty && !isSaving}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        elevation: 2,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    addButtonText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    slotCount: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    slotCard: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
    },
    slotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    dayBadgeText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeInputBox: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 8,
        marginLeft: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 48,
    },
    timeInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        marginLeft: 8,
        fontWeight: '500',
    },
    timeSeparator: {
        width: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    separatorLine: {
        width: 8,
        height: 2,
        backgroundColor: colors.border,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        backgroundColor: colors.white,
        padding: 40,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    footer: {
        marginTop: 10,
    },
    hintText: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButton: {
        height: 56,
        borderRadius: 16,
    },
});

export default DoctorAvailabilityScreen;
