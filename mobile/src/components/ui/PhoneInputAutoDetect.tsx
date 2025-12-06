import {
  AsYouType,
  type CountryCode,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { useCallback, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { useColors } from "@/theme";

const DEFAULT_COUNTRY: CountryCode = "US";

export default function PhoneInputAutoDetect({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const { colors: palette } = useColors();
  const [countryCodeValue, setCountryCodeValue] = useState(
    `${getCountryCallingCode(DEFAULT_COUNTRY)}`,
  );
  const [displayValue, setDisplayValue] = useState('');

  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY);

  const formatter = useMemo(() => new AsYouType(countryCode), [countryCode]);

  const processAndReport = useCallback(
    (input: string, currentCountry: CountryCode) => {
      const digitsOnly = input.replace(/[^\d+]/g, "");
      formatter.reset();
      const formattedDisplay = formatter.input(digitsOnly);
      if (formattedDisplay !== displayValue) {
        setDisplayValue(formattedDisplay);
      }

      const phoneNumber = parsePhoneNumberFromString(
        formattedDisplay,
        currentCountry,
      );

      let e164 = "";
      let _raw = digitsOnly;
      let _formatted = formattedDisplay;
      let newCountry = currentCountry;

      if (phoneNumber?.isValid()) {
        e164 = phoneNumber.number;
        _formatted = phoneNumber.formatNational();
        newCountry = phoneNumber.country || currentCountry;
        _raw = phoneNumber.nationalNumber; // Use the parsed national number digits
      } else if (digitsOnly.startsWith("+")) {
        e164 = digitsOnly;
        _formatted = digitsOnly;
      }

      if (newCountry !== currentCountry) {
        setCountryCode(newCountry);
      }

      onChange(e164);
    },
    [formatter, onChange, displayValue],
  ); // Depend on formatter and onChange

  const handleTextChange = (text: string) => {
    processAndReport(text, countryCode);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 8,
        borderRadius: 8,
      }}
    >
      <TextInput
        style={{
          fontSize: 24,
          height: 40,
          color: palette.foreground,
          letterSpacing: 2,
          fontStyle: 'italic',
        }}
        selectionColor={palette.foreground}
        value={"+"}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        editable={false}
      />
      <TextInput
        style={{
          fontSize: 24,
          height: 40,
          color: palette.foreground,
          letterSpacing: 2,
          fontStyle: 'italic',
          marginLeft: 4,
        }}
        selectionColor={palette.foreground}
        value={countryCodeValue}
        placeholder="1"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onChangeText={setCountryCodeValue}
        onBlur={() => {
          if (!countryCodeValue) {
            setCountryCodeValue('1')
          }
        }}
      />
      <TextInput
        style={{
          flex: 1,
          fontSize: 24,
          height: 40,
          color: palette.foreground,
          letterSpacing: 2,
          marginLeft: 12,
        }}
        selectionColor={palette.foreground}
        value={displayValue}
        placeholder="(000) 000-0000"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onChangeText={handleTextChange}
        autoFocus
      />
    </View>
  );
}
