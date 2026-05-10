import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminDoctorsScreen from '../screens/admin/AdminDoctorsScreen';
import AdminAppointmentsScreen from '../screens/admin/AdminAppointmentsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import ProfileScreen from '../screens/CommonProfileScreen';

const Tab = createBottomTabNavigator();

export const AdminTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Doctor') iconName = focused ? 'doctor' : 'doctor';
                else if (route.name === 'Appointments') iconName = focused ? 'calendar-multiple' : 'calendar-multiple';
                else if (route.name === 'Users') iconName = focused ? 'account-group' : 'account-group-outline';
                else if (route.name === 'Profile') iconName = focused ? 'account-cog' : 'account-cog-outline';
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
        <Tab.Screen name="Doctor" component={AdminDoctorsScreen} />
        <Tab.Screen name="Appointments" component={AdminAppointmentsScreen} />
        <Tab.Screen name="Users" component={AdminUsersScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);
