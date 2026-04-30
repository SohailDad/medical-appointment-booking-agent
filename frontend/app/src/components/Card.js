import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const Card = ({ children, style, mintBackground = false }) => {
    return (
        <View style={[
            styles.card,
            mintBackground ? styles.mintBg : styles.whiteBg,
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        marginVertical: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    whiteBg: {
        backgroundColor: colors.surface,
    },
    mintBg: {
        backgroundColor: colors.primaryLight,
    },
});

export default Card;
