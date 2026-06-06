import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatScreen from '../screens/patient/ChatScreen';
import PaymentScreen from '../screens/patient/PaymentScreen';
import { colors } from '../theme/colors';

const Stack = createStackNavigator();

export const PatientChatStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
            headerBackTitleVisible: false,
        }}
    >
        <Stack.Screen name="ChatMain" component={ChatScreen} options={{ title: 'Chat', headerShown: true }} />
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
    </Stack.Navigator>
);
