import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import ReportsScreen from '../screens/patient/ReportsScreen';
import { colors } from '../theme/colors';

const Stack = createStackNavigator();

export const PatientAppointmentStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
            headerBackTitleVisible: false,
        }}
    >
        <Stack.Screen
            name="AppointmentList"
            component={AppointmentsScreen}
            options={{ title: 'My Appointments' }}
        />
        <Stack.Screen
            name="MedicalReports"
            component={ReportsScreen}
            options={{ title: 'Medical Reports' }}
        />
    </Stack.Navigator>
);
