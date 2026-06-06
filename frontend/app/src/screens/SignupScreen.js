import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
                style={styles.keyboardAvoiding}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.logoContainer}>
                        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
                    </View>
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

                        <View style={[styles.footer, { marginTop: 0 }]}>
                            <Text style={styles.footerText}>Are you a doctor? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('DoctorSignup')}>
                                <Text style={styles.loginText}>Apply here</Text>
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
    keyboardAvoiding: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
    header: { marginBottom: 18, alignItems: 'center' },
    title: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
    subtitle: { fontSize: 15, color: colors.textSecondary },
    form: { width: '100%' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 0 },
    footerText: { color: colors.textSecondary, fontSize: 15 },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        width: 88,
        height: 88,
        marginBottom: 10,
    },
    loginText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
});

export default SignupScreen;