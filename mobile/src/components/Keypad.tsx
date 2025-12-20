import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/theme';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = width / 4;

interface KeypadProps {
  onPress: (val: string) => void;
  onDelete: () => void;
  showDecimal?: boolean;
}

export default function Keypad({ onPress, onDelete, showDecimal = true }: KeypadProps) {
  const { colors: palette, withOpacity } = useColors();

  const handlePress = (val: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(val);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const Key = ({ value, label, icon }: { value?: string; label?: string; icon?: string }) => (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => value ? handlePress(value) : (icon === 'backspace' ? handleDelete() : null)}
      style={styles.key}
    >
      {label ? (
        <Text style={[styles.keyText, { color: palette.foreground }]}>{label}</Text>
      ) : icon ? (
        <Ionicons name={icon as any} size={28} color={palette.foreground} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Key value="1" label="1" />
        <Key value="2" label="2" />
        <Key value="3" label="3" />
      </View>
      <View style={styles.row}>
        <Key value="4" label="4" />
        <Key value="5" label="5" />
        <Key value="6" label="6" />
      </View>
      <View style={styles.row}>
        <Key value="7" label="7" />
        <Key value="8" label="8" />
        <Key value="9" label="9" />
      </View>
      <View style={styles.row}>
        <Key value={showDecimal ? "." : undefined} label={showDecimal ? "." : undefined} />
        <Key value="0" label="0" />
        <Key icon="backspace" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  key: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
  },
});
