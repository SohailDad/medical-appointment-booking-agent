import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { PatientTabs } from './PatientTabs';
import { DoctorTabs } from './DoctorTabs';
import { AdminTabs } from './AdminTabs';
import { View, ActivityIndicator, Text } from 'react-native';
import { colors } from '../theme/colors';

export const RootNavigator = () => {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
            
        );
    }

    const renderContent = () => {
        if (!isAuthenticated) {
            return <AuthStack />;
        }

        switch (role) {
            case 'patient':
                return <PatientTabs />;
            case 'doctor':
                return <DoctorTabs />;
            case 'admin':
                return <AdminTabs />;
            default:
                return <AuthStack />; // Fallback
        }
    };

    return (
        <NavigationContainer>
            {renderContent()}
        </NavigationContainer>
    );
};
