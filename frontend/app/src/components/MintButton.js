import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

const MintButton = ({ title, onPress, loading, disabled, style, textStyle, variant = 'primary' }) => {
    const isPrimary = variant === 'primary';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading || disabled}
            style={[
                styles.button,
                isPrimary ? styles.primaryButton : styles.secondaryButton,
                (loading || disabled) && styles.disabled,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
            ) : (
                <Text style={[
                    styles.text,
                    isPrimary ? styles.primaryText : styles.secondaryText,
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        flexDirection: 'row',
    },
    primaryButton: {
        backgroundColor: colors.primary,
    },
    secondaryButton: {
        backgroundColor: colors.primaryLight,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: colors.white,
    },
    secondaryText: {
        color: colors.primary,
    },
});

export default MintButton;
