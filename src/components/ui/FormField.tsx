import React from 'react';
import { View } from 'dripsy';
import type { SxProp } from 'dripsy';
import Text from './Text';
import TextInput from './TextInput';
import type { TextInputProps } from './TextInput';
import { SPACING } from '@/theme/constants';

export interface FormFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerSx?: SxProp;
  labelSx?: SxProp;
  errorSx?: SxProp;
  hintSx?: SxProp;
}

const FormField = React.forwardRef<any, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      required = false,
      containerSx,
      labelSx,
      errorSx,
      hintSx,
      ...inputProps
    },
    ref,
  ) => {
    const hasError = Boolean(error);

    return (
      <View sx={{ ...containerSx }}>
        {label && (
          <View sx={{ marginBottom: SPACING.XS, flexDirection: 'row', alignItems: 'center' }}>
            <Text
              variant="sm"
              tone="secondary"
              sx={{
                fontWeight: '600',
                ...labelSx,
              }}
            >
              {label}
            </Text>
            {required && (
              <Text
                variant="sm"
                sx={{
                  color: 'error',
                  marginLeft: 1,
                }}
              >
                *
              </Text>
            )}
          </View>
        )}

        <TextInput
          ref={ref}
          {...inputProps}
          style={[
            inputProps.style,
            hasError && {
              borderColor: 'error',
            },
          ]}
        />

        {error && (
          <Text
            variant="xs"
            sx={{
              color: 'error',
              marginTop: SPACING.XS,
              ...errorSx,
            }}
          >
            {error}
          </Text>
        )}

        {hint && !error && (
          <Text
            variant="xs"
            tone="tertiary"
            sx={{
              marginTop: SPACING.XS,
              ...hintSx,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
    );
  },
);

FormField.displayName = 'FormField';

export default FormField;
