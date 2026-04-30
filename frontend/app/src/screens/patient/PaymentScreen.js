import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import apiClient from '../../api/client';

const PaymentScreen = ({ route, navigation }) => {
    const { amount, appointmentData, onPaymentComplete } = route.params;
    const [loading, setLoading] = useState(false);

    const handlePayNow = async () => {
        setLoading(true);
        try {
            // Call POST /payment/create-intent
            await apiClient.post('/payment/create-intent', { amount });
            
            // Open payment UI (simulated success here)
            
            // After success call: POST /chat/continue
            const response = await apiClient.post('/chat/continue', {
                action: "PAYMENT_SUCCESS",
                appointmentData
            });
            
            if (response.data && response.data.action) {
                onPaymentComplete(response.data);
            }
            navigation.goBack();
        } catch (error) {
            setLoading(false);
            if (!error.response) {
                Alert.alert('Error', 'No internet connection');
                onPaymentComplete({ action: 'ERROR', message: 'No internet connection' });
            } else {
                Alert.alert('Error', 'Payment failed');
                onPaymentComplete({ action: 'ERROR', message: 'Payment failed' });
            }
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Payment Required</Text>
                <Text style={styles.amount}>Amount: ${amount}</Text>
                <TouchableOpacity style={styles.payButton} onPress={handlePayNow} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.payButtonText}>Pay Now</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: colors.text },
    amount: { fontSize: 20, marginBottom: 40, color: colors.primary },
    payButton: { backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, width: '100%', alignItems: 'center' },
    payButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' }
});

export default PaymentScreen;
