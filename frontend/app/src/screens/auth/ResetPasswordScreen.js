import React from 'react';
import { View, Text, Image, StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import FormInput from '../../components/FormInput';
import MintButton from '../../components/MintButton';
import { colors } from '../../theme/colors';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const ResetPasswordScreen = ({ navigation, route }) => {
    const { token } = route.params || {};
    const { control, handleSubmit, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            await apiClient.post('/auth/reset-password', { ...data, token });
            Toast.show({ type: 'success', text1: 'Password reset successful' });
            navigation.navigate('Login');
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Reset failed' });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.title}>New Password</Text>
                <Text style={styles.subtitle}>Create a strong password for your account</Text>

                <FormInput
                    control={control}
                    name="password"
                    label="New Password"
                    placeholder="••••••••"
                    secureTextEntry
                    rules={{ required: 'Password is required' }}
                />

                <FormInput
                    control={control}
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="••••••••"
                    secureTextEntry={true}
                    rules={{ required: 'Please confirm password' }}
                />

                <MintButton
                    title="Update Password"
                    onPress={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                />
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
    },
});

export default ResetPasswordScreen;
