import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import BookAppointmentScreen from '../screens/patient/BookAppointmentScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
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
            name="BookAppointment"
            component={BookAppointmentScreen}
            options={{ title: 'Book New' }}
        />
        <Stack.Screen name="RescheduleAppointment">
            {(props) => <PlaceholderScreen {...props} title="Reschedule Appointment" />}
        </Stack.Screen>
    </Stack.Navigator>
);
