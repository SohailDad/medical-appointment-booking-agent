import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import FormInput from '../../components/FormInput';
import MintButton from '../../components/MintButton';
import { colors } from '../../theme/colors';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const DoctorAvailabilityScreen = () => {
    const { control, handleSubmit, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            await apiClient.put('/doctor/availability', data);
            Toast.show({ type: 'success', text1: 'Availability updated' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Update failed' });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Manage My Hours</Text>
                <Text style={styles.subtitle}>Set your weekly working hours and breaks</Text>

                <View style={styles.form}>
                    <FormInput
                        control={control}
                        name="workingDays"
                        label="Working Days"
                        placeholder="e.g. Mon, Tue, Wed, Thu, Fri"
                    />

                    <FormInput
                        control={control}
                        name="startTime"
                        label="Start Time"
                        placeholder="e.g. 09:00 AM"
                    />

                    <FormInput
                        control={control}
                        name="endTime"
                        label="End Time"
                        placeholder="e.g. 05:00 PM"
                    />

                    <MintButton
                        title="Update Availability"
                        onPress={handleSubmit(onSubmit)}
                        loading={isSubmitting}
                        style={{ marginTop: 20 }}
                    />
                </View>
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
        padding: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 32,
    },
    form: {
        flex: 1,
    },
});

export default DoctorAvailabilityScreen;
