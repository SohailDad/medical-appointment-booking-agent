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
import axios from 'axios';

const LoginScreen = ({ navigation }) => {
    const { control, handleSubmit, formState: { isSubmitting } } = useForm();
    const { login } = useAuth();

    const onSubmit = async (data) => {
        try {
            console.log("hi")
            const response = await apiClient.post('/auth/login', data);
            const { user, token } = response.data;
            await login(user, token);
        } catch (error) {
            if (__DEV__) {
                console.error('Login Error:', error);
            }

            let message = 'Something went wrong';

            if (error.response) {
                // Backend error (wrong credentials, validation, etc.)
                message = error.response.data?.message || 'Invalid credentials';
            } else if (error.request) {
                // No internet / server not reachable
                message = 'No internet connection. Please check your network.';
            } else {
                // Other errors
                message = error.message;
            }

            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: message,
            });
            // console.error("ERRor:",error)
            // Toast.show({
            //     type: 'error',
            //     text1: 'Login Failed',
            //     text2: error.response?.data?.message || 'Invalid credentials'
            // });
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to your medical account</Text>
                    </View>

                    <View style={styles.form}>
                        <FormInput
                            control={control}
                            name="email"
                            label="Email Address"
                            placeholder="e.g. patient@example.com"
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
                            rules={{ required: 'Password is required' }}
                        />

                        <TouchableOpacity
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={styles.forgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <MintButton
                            title="Sign In"
                            onPress={() => handleSubmit(onSubmit)()}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: colors.textSecondary,
        fontSize: 15,
    },
    signupText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default LoginScreen;