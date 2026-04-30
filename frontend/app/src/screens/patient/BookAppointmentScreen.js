import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import FormInput from '../../components/FormInput';
import MintButton from '../../components/MintButton';
import { colors } from '../../theme/colors';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const BookAppointmentScreen = ({ navigation }) => {
    const { control, handleSubmit, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            await apiClient.post('/appointments/book', data);
            Toast.show({
                type: 'success',
                text1: 'Success!',
                text2: 'Your appointment has been booked'
            });
            navigation.goBack();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Booking Failed',
                text2: error.response?.data?.message || 'Please try again later'
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Book Appointment</Text>
                    <Text style={styles.subtitle}>Fill in the details below to schedule your visit</Text>
                </View>

                <View style={styles.form}>
                    <FormInput
                        control={control}
                        name="doctorName"
                        label="Select Doctor"
                        placeholder="e.g. Dr. Sarah Adams"
                        rules={{ required: 'Doctor name is required' }}
                    />

                    <FormInput
                        control={control}
                        name="date"
                        label="Date"
                        placeholder="YYYY-MM-DD"
                        rules={{
                            required: 'Date is required',
                            pattern: { value: /^\d{4}-\d{2}-\d{2}$/, message: 'Use YYYY-MM-DD format' }
                        }}
                    />

                    <FormInput
                        control={control}
                        name="time"
                        label="Preferred Time"
                        placeholder="e.g. 10:30 AM"
                        rules={{ required: 'Time is required' }}
                    />

                    <FormInput
                        control={control}
                        name="purpose"
                        label="Purpose of Visit"
                        placeholder="e.g. Annual checkup"
                        multiline
                        numberOfLines={3}
                        style={styles.textArea}
                        rules={{ required: 'Purpose is required' }}
                    />

                    <View style={styles.spacer} />

                    <MintButton
                        title="Confirm Booking"
                        onPress={handleSubmit(onSubmit)}
                        loading={isSubmitting}
                    />

                    <MintButton
                        title="Cancel"
                        variant="secondary"
                        onPress={() => navigation.goBack()}
                        disabled={isSubmitting}
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
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    form: {
        flex: 1,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    spacer: {
        height: 20,
    },
});

export default BookAppointmentScreen;
