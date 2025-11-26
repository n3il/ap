import { MaterialCommunityIcons } from "@expo/vector-icons";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useEffect, useRef, useState } from "react";
import PhoneInput from "react-native-phone-number-input";
import { useColors } from "@/theme";

export default function PhoneInputAutoDetect({
  value,
  onChange,
  defaultCode = "US",
}) {
  const { colors: palette } = useColors();
  const phoneRef = useRef(null);

  // internal = what user sees in the TextInput (national format)
  const [internal, setInternal] = useState(value || "");

  // keep internal in sync if parent changes `value`
  useEffect(() => {
    if (!value) {
      setInternal("");
      return;
    }

    const parsed = safeParse(value, defaultCode);
    setInternal(parsed.national || value);
  }, [value, defaultCode, safeParse]);

  /**
   * Helper: safely parse a string into:
   * - e164: +19023391576
   * - national: (902) 339-1576
   * - country: 'US'
   */
  const safeParse = (input, fallbackCountry) => {
    const digitsOnly = (input || "").replace(/[^\d]/g, "");

    if (!digitsOnly) {
      return { e164: "", national: "", country: fallbackCountry };
    }

    // 1) Try interpreting as full international (+countrycode...)
    let phone = parsePhoneNumberFromString(`+${digitsOnly}`);

    // 2) If that fails, try as national number for fallback country
    if (!phone) {
      phone = parsePhoneNumberFromString(digitsOnly, fallbackCountry);
    }

    if (!phone) {
      // If still nothing, just return raw-ish
      return {
        e164: `+${digitsOnly}`,
        national: digitsOnly,
        country: fallbackCountry,
      };
    }

    return {
      e164: phone.number, // +19023391576
      national: phone.formatNational(), // (902) 339-1576
      country: phone.country || fallbackCountry,
    };
  };

  const handleChange = (rawText) => {
    // strip everything but digits for parsing
    const digitsOnly = rawText.replace(/[^\d]/g, "");

    const { e164, national } = safeParse(digitsOnly, defaultCode);

    // show nicely formatted national string in the input
    setInternal(national);

    // parent gets proper E.164 value
    onChange?.({ raw: digitsOnly, formatted: national, e164 });
  };

  return (
    <PhoneInput
      ref={phoneRef}
      defaultCode={defaultCode}
      layout="first"
      withDarkTheme
      withShadow={true}
      autoFocus
      placeholder="(000) 000-0000"
      // what user sees
      value={internal}
      onChangeText={handleChange}
      // we’re already computing E.164 ourselves, so this can be ignored
      onChangeFormattedText={() => {}}
      // ---- your styles preserved ----
      containerStyle={{
        backgroundColor: "transparent",
        alignItems: "center",
      }}
      textContainerStyle={{
        backgroundColor: "transparent",
        paddingHorizontal: 2,
      }}
      textInputStyle={{
        fontSize: 24,
        fontWeight: "300",
        color: palette.foreground,
      }}
      codeTextStyle={{
        fontSize: 24,
        fontWeight: "300",
        color: palette.textSecondary,
      }}
      flagButtonStyle={{
        borderRadius: 999,
        padding: 0,
        margin: 0,
      }}
      countryPickerButtonStyle={{
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 999,
        paddingHorizontal: 12,
        height: 44,
        marginRight: 8,
      }}
      countryPickerProps={{
        renderFlagButton: undefined,
        withAlphaFilter: true,
      }}
      renderDropdownImage={
        <MaterialCommunityIcons
          name="chevron-down"
          size={24}
          color={palette.foreground}
        />
      }
    />
  );
}
