import React, { useState, useMemo, useCallback } from 'react';
import { View, TextInput } from 'react-native';
import { CountryCode, AsYouType, parsePhoneNumberFromString, getCountryCallingCode } from 'libphonenumber-js';
import { useColors } from '@/theme';

const DEFAULT_COUNTRY: CountryCode = 'US';

export default function PhoneInputAutoDetect({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const { colors: palette } = useColors();
  const [displayValue, setDisplayValue] = useState(
    `+${getCountryCallingCode(DEFAULT_COUNTRY)}`
  );

  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY);

  const formatter = useMemo(() => new AsYouType(countryCode), [countryCode]);

  const processAndReport = useCallback((input: string, currentCountry: CountryCode) => {
    const digitsOnly = input.replace(/[^\d+]/g, '');
    formatter.reset();
    const formattedDisplay = formatter.input(digitsOnly);
    if (formattedDisplay !== displayValue) {
        setDisplayValue(formattedDisplay);
    }

    const phoneNumber = parsePhoneNumberFromString(formattedDisplay, currentCountry);

    let e164 = '';
    let raw = digitsOnly;
    let formatted = formattedDisplay;
    let newCountry = currentCountry;

    if (phoneNumber && phoneNumber.isValid()) {
      e164 = phoneNumber.number;
      formatted = phoneNumber.formatNational();
      newCountry = phoneNumber.country || currentCountry;
      raw = phoneNumber.nationalNumber; // Use the parsed national number digits
    } else if (digitsOnly.startsWith('+')) {
      e164 = digitsOnly;
      formatted = digitsOnly;
    }


    if (newCountry !== currentCountry) {
      setCountryCode(newCountry);
    }

    onChange(e164);

  }, [formatter, onChange]); // Depend on formatter and onChange

  const handleTextChange = (text: string) => {
    processAndReport(text, countryCode);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
      }}
    >
      <TextInput
        style={{
          flex: 1,
          fontSize: 18,
          height: 40,
          paddingHorizontal: 8,
          color: "#fff",
          letterSpacing: 2
        }}
        selectionColor={palette.foreground}
        value={displayValue}
        placeholder="+1 (000) 000-0000"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onChangeText={handleTextChange}
        autoFocus
      />
    </View>
  );
}
