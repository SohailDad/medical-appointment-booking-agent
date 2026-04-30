import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const Badge = ({ text, type = 'primary', style }) => {
    const getBadgeStyle = () => {
        switch (type) {
            case 'success': return { bg: '#D1FAE5', text: '#059669' };
            case 'error': return { bg: '#FEE2E2', text: '#DC2626' };
            case 'warning': return { bg: '#FEF3C7', text: '#D97706' };
            default: return { bg: colors.primaryLight, text: colors.primary };
        }
    };

    const badgeTheme = getBadgeStyle();

    return (
        <View style={[styles.badge, { backgroundColor: badgeTheme.bg }, style]}>
            <Text style={[styles.text, { color: badgeTheme.text }]}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
});

export default Badge;
