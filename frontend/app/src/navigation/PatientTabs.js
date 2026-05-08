import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import { PatientAppointmentStack } from './PatientAppointmentStack';
import { PatientChatStack } from './PatientChatStack';
import ProfileScreen from '../screens/CommonProfileScreen';

const Tab = createBottomTabNavigator();

export const PatientTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'Appointments') iconName = focused ? 'calendar-check' : 'calendar-check-outline';
                else if (route.name === 'Chat') iconName = focused ? 'chat' : 'chat-outline';
                else if (route.name === 'Profile') iconName = focused ? 'account' : 'account-outline';
                return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            headerShown: true,
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
        })}
    >
        <Tab.Screen name="Home" component={PatientHomeScreen} />
        <Tab.Screen
            name="Appointments"
            component={PatientAppointmentStack}
            options={{ headerShown: false }}
        />
        <Tab.Screen name="Chat" component={PatientChatStack} options={{ headerShown: false }} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);
