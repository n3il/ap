import { useColors } from '@/theme';
import { Stack } from 'expo-router';

export default function SearchLayout() {
  const { colors: palette } = useColors()
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Search',
          headerStyle: {
            backgroundColor: palette.background,

          },
          headerTitleStyle: {
            color: palette.foreground,
          },
          headerSearchBarOptions: {
            placement: 'automatic',
            placeholder: 'Search',
            onChangeText: () => {},
          },
        }}
      />
    </Stack>
  );
}
