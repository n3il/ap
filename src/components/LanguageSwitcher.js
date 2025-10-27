import React from 'react';
import { View, Text, TouchableOpacity, Stack } from '@/components/ui';
import { useLocalization } from '@/hooks/useLocalization';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function LanguageSwitcher() {
  const { locale, changeLocale } = useLocalization();

  return (
    <View sx={{ width: '100%' }}>
      <Text variant="sm" sx={{ fontWeight: '600', marginBottom: 3 }}>
        Language / Idioma / Langue
      </Text>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        {LANGUAGES.map((language) => {
          const isActive = locale === language.code;

          return (
            <TouchableOpacity
              key={language.code}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isActive ? '#10b981' : '#333',
                backgroundColor: isActive ? '#10b981' : '#1a1a1a',
              }}
              onPress={() => changeLocale(language.code)}
              activeOpacity={0.85}
            >
              <Text variant="xl" sx={{ marginRight: 2 }}>
                {language.flag}
              </Text>
              <Text
                variant="sm"
                sx={{
                  fontWeight: '500',
                  color: isActive ? 'white' : 'textPrimary',
                }}
              >
                {language.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Stack>
    </View>
  );
}
