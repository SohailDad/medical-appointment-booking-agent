import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

const Loader = ({ fullScreen = false, message }) => {
    if (fullScreen) {
        return (
            <View style={styles.fullScreen}>
                <ActivityIndicator size="large" color={colors.primary} />
                {message && <Text style={styles.message}>{message}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.inline}>
            <ActivityIndicator size="small" color={colors.primary} />
            {message && <Text style={styles.inlineMessage}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    inline: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: 12,
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    inlineMessage: {
        marginTop: 8,
        fontSize: 14,
        color: colors.textSecondary,
    },
});

export default Loader;
