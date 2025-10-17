// Core UI components
export { default as Box } from './Box';
export { default as Text } from './Text';
export { default as Button } from './Button';
export { default as IconButton } from './IconButton';
export { default as TextInput } from './TextInput';
export { default as TouchableOpacity } from './TouchableOpacity';
export { default as SafeAreaView } from './SafeAreaView';
export { default as ScrollView } from './ScrollView';

// Layout components
export { default as Card } from './Card';
export { default as Stack } from './Stack';
export { default as ListItem } from './ListItem';
export { default as Spacer } from './Spacer';

// Display components
export { default as StatusBadge } from './StatusBadge';
export { default as Badge } from './Badge';
export { default as LabelValue } from './LabelValue';
export { default as Divider } from './Divider';
export { default as Separator } from './Separator';
export { default as Skeleton } from './Skeleton';

// Form components
export { default as FormField } from './FormField';

// Export React Native View directly for compatibility
export { View } from 'react-native';

export {
  ActivityIndicator,
  Alert,
  Animated,
  Appearance,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';

export type {
  ActivityIndicatorProps,
  FlatListProps,
  ImageProps,
  KeyboardAvoidingViewProps,
  ModalProps,
  RefreshControlProps,
  ScrollViewProps,
  StatusBarProps,
  StyleProp,
  TextStyle,
  TouchableOpacityProps,
  TextProps as RNTextProps,
  TextInputProps as RNTextInputProps,
  ViewProps,
} from 'react-native';
