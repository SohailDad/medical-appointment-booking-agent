import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import FormInput from '../components/FormInput';
import MintButton from '../components/MintButton';
import { colors } from '../theme/colors';
import apiClient from '../api/client';
import Toast from 'react-native-toast-message';

const DoctorSignupScreen = ({ navigation }) => {
    const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            role: 'doctor'
        }
    });

    const onSubmit = async (data) => {
        try {
            const { confirmPassword, ...rest } = data;
            const cleanedData = {
                ...rest,
                name: data.name.trim(),
                email: data.email.trim().toLowerCase(),
                specialization: data.specialization.trim(),
                degree: data.degree.trim(),
                experience: Number(data.experience),
                licenseNumber: data.licenseNumber.trim(),
                description: data.description.trim(),
            };
            await apiClient.post('/auth/register-doctor', cleanedData);
            
            Toast.show({
                type: 'success',
                text1: 'Signup Successful',
                text2: 'Your account is under verification by an admin. You can login once approved.',
            });
            
            // Navigate back to login
            setTimeout(() => {
                navigation.navigate('Login');
            }, 2000);
            
        } catch (error) {
            let message = 'Something went wrong';

            if (error.response) {
                message = error.response.data?.message;
            } else if (error.request) {
                message = 'No internet connection. Please check your internet.';
            } else {
                message = error.message;
            }

            Toast.show({
                type: 'error',
                text1: 'Signup Failed',
                text2: message,
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.logoContainer}>
                        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
                    </View>
                    <View style={styles.header}>
                        <Text style={styles.title}>Apply as a Doctor</Text>
                        <Text style={styles.subtitle}>Join our platform as a healthcare provider</Text>
                    </View>

                    <View style={styles.form}>
                        <FormInput
                            control={control}
                            name="name"
                            label="Full Name *"
                            placeholder="e.g. Dr. John Doe"
                            rules={{ required: 'Name is required' }}
                        />

                        <FormInput
                            control={control}
                            name="email"
                            label="Email Address *"
                            placeholder="e.g. doctor@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            rules={{
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            }}
                        />

                        <FormInput
                            control={control}
                            name="password"
                            label="Password *"
                            placeholder="••••••••"
                            secureTextEntry={true}
                            rules={{
                                required: 'Password is required',
                                minLength: { value: 6, message: 'Minimum 6 characters' }
                            }}
                        />

                        <FormInput
                            control={control}
                            name="confirmPassword"
                            label="Confirm Password *"
                            placeholder="••••••••"
                            secureTextEntry={true}
                            rules={{
                                required: 'Confirm your password',
                                validate: (value) => value === watch('password') || 'Passwords do not match'
                            }}
                        />

                        <FormInput
                            control={control}
                            name="specialization"
                            label="Specialization *"
                            placeholder="e.g. Cardiology"
                            rules={{ required: 'Specialization is required' }}
                        />

                        <FormInput
                            control={control}
                            name="degree"
                            label="Degree *"
                            placeholder="e.g. MBBS, MD"
                            rules={{ required: 'Degree is required' }}
                        />

                        <FormInput
                            control={control}
                            name="experience"
                            label="Years of Experience *"
                            placeholder="e.g. 5"
                            keyboardType="numeric"
                            rules={{ 
                                required: 'Experience is required',
                                pattern: { value: /^\d+$/, message: 'Must be a whole number' }
                            }}
                        />

                        <FormInput
                            control={control}
                            name="licenseNumber"
                            label="License / PMC Number *"
                            placeholder="e.g. PMC-12345"
                            rules={{ required: 'License number is required' }}
                        />

                        <FormInput
                            control={control}
                            name="description"
                            label="Professional Bio *"
                            placeholder="Brief description about yourself..."
                            multiline
                            numberOfLines={3}
                            rules={{ required: 'Description is required' }}
                        />

                        <MintButton
                            title="Submit Application"
                            onPress={handleSubmit(onSubmit)}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            style={{ marginTop: 16 }}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already registered? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    header: { marginBottom: 32, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
    form: { width: '100%' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40 },
    footerText: { color: colors.textSecondary, fontSize: 15 },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 12,
    },
    loginText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
});

export default DoctorSignupScreen;
