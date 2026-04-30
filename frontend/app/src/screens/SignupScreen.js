import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import FormInput from '../components/FormInput';
import MintButton from '../components/MintButton';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Toast from 'react-native-toast-message';

const SignupScreen = ({ navigation }) => {
    const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            role: 'patient'
        }
    });
    const { login } = useAuth();

    const onSubmit = async (data) => {
        try {
            const { confirmPassword, ...rest } = data;
            const cleanedData = {
                ...rest,
                name: data.name.trim(),
                email: data.email.trim().toLowerCase(),
            };
            const response = await apiClient.post('/auth/signup', cleanedData);
            const { user, token } = response.data;
            await login(user, token);
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
            // const message = error.response?.data?.message || error.message || 'Something went wrong';
            // Toast.show({
            //     type: 'error',
            //     text1: 'Signup Failed',
            //     text2: message
            // });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join our medical platform</Text>
                    </View>

                    <View style={styles.form}>
                        <FormInput
                            control={control}
                            name="name"
                            label="Full Name"
                            placeholder="e.g. John Doe"
                            rules={{ required: 'Name is required' }}
                        />

                        <FormInput
                            control={control}
                            name="email"
                            label="Email Address"
                            placeholder="e.g. john@example.com"
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
                            label="Password"
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
                            label="Confirm Password"
                            placeholder="••••••••"
                            secureTextEntry={true}
                            rules={{
                                required: 'Confirm your password',
                                validate: (value) => value === watch('password') || 'Passwords do not match'
                            }}
                        />

                        <MintButton
                            title="Sign Up"
                            onPress={handleSubmit(onSubmit)}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            style={{ marginTop: 16 }}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
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
    subtitle: { fontSize: 16, color: colors.textSecondary },
    form: { width: '100%' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 20 },
    footerText: { color: colors.textSecondary, fontSize: 15 },
    loginText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
});

export default SignupScreen;