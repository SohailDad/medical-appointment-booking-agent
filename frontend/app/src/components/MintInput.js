import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const MintInput = ({
    label,
    error,
    placeholder,
    value,
    onChangeText,
    onBlur,
    secureTextEntry = false,   // ✅ default to boolean false
    keyboardType = 'default',  // ✅ default to string
    autoCapitalize = 'none',
    autoCorrect = false,       // ✅ explicitly extract & default
    containerStyle,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error ? styles.inputError : null
                ]}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
                secureTextEntry={!!secureTextEntry}   // ✅ force boolean
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={!!autoCorrect}           // ✅ force boolean
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 6,
        marginLeft: 4,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text,
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});

export default MintInput;