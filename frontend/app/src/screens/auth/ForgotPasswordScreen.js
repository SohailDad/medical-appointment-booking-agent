import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import FormInput from '../../components/FormInput';
import MintButton from '../../components/MintButton';
import { colors } from '../../theme/colors';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const ForgotPasswordScreen = ({ navigation }) => {
    const { control, handleSubmit, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            await apiClient.post('/auth/forgot-password', data);
            Toast.show({
                type: 'success',
                text1: 'Email Sent',
                text2: 'Please check your inbox for reset instructions'
            });
            navigation.goBack();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to process request'
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>

                <FormInput
                    control={control}
                    name="email"
                    label="Email Address"
                    placeholder="e.g. john@example.com"
                    keyboardType="email-address"
                    rules={{ required: 'Email is required' }}
                />

                <MintButton
                    title="Send Link"
                    onPress={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                />

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 32,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 12,
    },
    backButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    backText: {
        color: colors.primary,
        fontWeight: '600',
    }
});

export default ForgotPasswordScreen;
