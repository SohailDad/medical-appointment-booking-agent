import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorAvailabilityScreen from '../screens/doctor/DoctorAvailabilityScreen';
import ProfileScreen from '../screens/CommonProfileScreen';

const Tab = createBottomTabNavigator();

export const DoctorTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Appointments') iconName = focused ? 'calendar-text' : 'calendar-text-outline';
                else if (route.name === 'Availability') iconName = focused ? 'clock' : 'clock-outline';
                else if (route.name === 'Profile') iconName = focused ? 'account' : 'account-outline';
                return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
        })}
    >
        <Tab.Screen name="Appointments" component={DoctorAppointmentsScreen} />
        <Tab.Screen name="Availability" component={DoctorAvailabilityScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);
