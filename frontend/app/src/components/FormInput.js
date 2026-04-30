import React from 'react';
import { Controller } from 'react-hook-form';
import MintInput from './MintInput';

const FormInput = ({ control, name, rules, defaultValue = '', ...props }) => {
    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            defaultValue={defaultValue}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <MintInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={error?.message}
                    {...props}
                />
            )}
        />
    );
};

export default FormInput;
