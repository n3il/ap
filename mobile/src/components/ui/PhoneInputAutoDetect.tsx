import {
  AsYouType,
  type CountryCode,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  PhoneNumber,
} from "libphonenumber-js";
import { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { useColors } from "@/theme";

const DEFAULT_COUNTRY: CountryCode = "US";

export default function PhoneInputAutoDetect({
  onChange,
}: {
  onChange: (value) => void;
}) {
  const { colors: palette } = useColors();

  // ---- single sources of truth ----
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [callingCode, setCallingCode] = useState(
    getCountryCallingCode(DEFAULT_COUNTRY),
  );
  const [nationalDigits, setNationalDigits] = useState("");

  // ---- derived formatted display (never edited directly) ----
  const displayValue = useMemo(() => {
    const formatter = new AsYouType(country);
    return formatter.input(nationalDigits);
  }, [country, nationalDigits]);

  // ---- emit E.164 upward ----
  useEffect(() => {
    const full = `+${callingCode}${nationalDigits}`;
    const phone = parsePhoneNumberFromString(full);

    onChange([phone?.number || "", phone?.isValid() || false]);
  }, [callingCode, nationalDigits]);

  // ---- handlers ----
  const handleCallingCodeChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setCallingCode(digits);

    // Try to auto-detect country from new calling code + national digits
    const phone = parsePhoneNumberFromString(`+${digits}${nationalDigits}`);

    if (phone?.country && phone.country !== country) {
      setCountry(phone.country);
    }
  };

  const handleNationalChange = (text: string) => {
    const isDeleting = text.length < displayValue.length;

    if (isDeleting) {
      const lastChar = displayValue[selection.start - 1];

      // If deleting formatting, just move cursor left
      if (lastChar && /\D/.test(lastChar)) {
        setSelection({
          start: selection.start - 1,
          end: selection.start - 1,
        });
        return;
      }
    }

    const digits = text.replace(/\D/g, "");
    setNationalDigits(digits);
  };

  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        borderRadius: 8,
      }}
    >
      {/* + (fixed) */}
      <TextInput
        value="+"
        editable={false}
        style={{
          fontSize: 24,
          height: 40,
          color: palette.foreground,
        }}
      />

      {/* country calling code */}
      <TextInput
        value={callingCode}
        placeholder="1"
        keyboardType="number-pad"
        onChangeText={handleCallingCodeChange}
        style={{
          fontSize: 24,
          height: 40,
          color: palette.foreground,
          marginLeft: 4,
          minWidth: 18,
        }}
      />

      {/* national number */}
      <TextInput
        value={displayValue}
        placeholder="(000) 000-0000"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        onChangeText={handleNationalChange}
        autoFocus
        style={{
          flex: 1,
          fontSize: 24,
          height: 40,
          color: palette.foreground,
          marginLeft: 12,
          letterSpacing: 2,
        }}
      />
    </View>
  );
}
