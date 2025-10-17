# Theme System

Comprehensive guide to using the DRY'd up theme system, components, and utilities.

## Table of Contents

- [Quick Start](#quick-start)
- [Theme Utilities](#theme-utilities)
- [Constants](#constants)
- [Style Utilities](#style-utilities)
- [Components](#components)
- [Best Practices](#best-practices)

## Quick Start

```tsx
import { Card, Stack, Text, Button } from '@/components/ui';
import { SPACING, useColors, shadows } from '@/theme';

function MyComponent() {
  const { primary, textPrimary } = useColors();

  return (
    <Card variant="elevated" sx={{ padding: SPACING.LG }}>
      <Stack direction="column" spacing={SPACING.MD}>
        <Text variant="h3">Hello World</Text>
        <Button variant="primary">Click me</Button>
      </Stack>
    </Card>
  );
}
```

## Theme Utilities

### Hooks

#### `useColors()`
Access all theme colors and color utilities.

```tsx
const {
  colors,           // All theme colors
  primary,          // Quick access to common colors
  secondary,
  accent,
  background,
  textPrimary,
  withOpacity,      // Add opacity to any color
  hexToRgba,        // Convert hex to rgba
  blendColors,      // Blend two colors
} = useColors();

// Usage
<View style={{ backgroundColor: withOpacity(primary, 0.5) }} />
```

#### `useSpacing()`
Access spacing utilities.

```tsx
const { space, get, multiply } = useSpacing();

// Usage
const padding = get('4');  // 16px
const doublePadding = multiply('4', 2);  // 32px
```

#### `useRadius()`
Access border radius utilities.

```tsx
const { radii, get } = useRadius();

const borderRadius = get('xl');  // 16
```

#### `useGlassEffect()`
Access glass effect configuration.

```tsx
const glass = useGlassEffect();
// { intensity: 20, tintColor: 'rgba(0, 0, 0, 0.9)', effectStyle: 'clear', borderRadius: 16 }
```

#### `useThemeUtils()`
Combined hook for all utilities.

```tsx
const { colors, spacing, radius, glass, typography } = useThemeUtils();
```

## Constants

### SPACING
Predefined spacing values (Dripsy tokens).

```tsx
import { SPACING } from '@/theme';

SPACING.XXS  // 0.5 -> 2px
SPACING.XS   // 1   -> 4px
SPACING.SM   // 2   -> 8px
SPACING.MD   // 3   -> 12px
SPACING.LG   // 4   -> 16px
SPACING.XL   // 6   -> 24px
SPACING.XXL  // 8   -> 32px
```

### LAYOUT
Common layout values.

```tsx
import { LAYOUT } from '@/theme';

LAYOUT.CONTAINER_PADDING  // 16
LAYOUT.SECTION_SPACING    // 12
LAYOUT.ITEM_GAP          // 8
LAYOUT.SCREEN_PADDING    // 16
LAYOUT.CARD_PADDING      // 16
LAYOUT.MODAL_PADDING     // 20
```

### RADIUS
Border radius tokens.

```tsx
import { RADIUS } from '@/theme';

RADIUS.XS    // 'xs'   -> 4px
RADIUS.SM    // 'sm'   -> 6px
RADIUS.MD    // 'md'   -> 8px
RADIUS.LG    // 'lg'   -> 12px
RADIUS.XL    // 'xl'   -> 16px
RADIUS.XXL   // '2xl'  -> 20px
RADIUS.XXXL  // '3xl'  -> 24px
RADIUS.FULL  // 'full' -> 9999
```

### Z_INDEX
Z-index layers.

```tsx
import { Z_INDEX } from '@/theme';

Z_INDEX.BASE            // 0
Z_INDEX.DROPDOWN        // 1000
Z_INDEX.MODAL           // 1050
Z_INDEX.TOOLTIP         // 1070
```

### DURATION
Animation durations (ms).

```tsx
import { DURATION } from '@/theme';

DURATION.INSTANT  // 0
DURATION.FAST     // 150
DURATION.NORMAL   // 250
DURATION.SLOW     // 400
```

### OPACITY
Opacity values.

```tsx
import { OPACITY } from '@/theme';

OPACITY.DISABLED  // 0.4
OPACITY.SUBTLE    // 0.6
OPACITY.MEDIUM    // 0.8
OPACITY.FULL      // 1
```

## Style Utilities

Pre-built style patterns for common use cases.

### Shadows

```tsx
import { shadows } from '@/theme';

<View sx={shadows.sm} />   // Small shadow
<View sx={shadows.md} />   // Medium shadow
<View sx={shadows.lg} />   // Large shadow
<View sx={shadows.xl} />   // Extra large shadow
```

### Flex

```tsx
import { flex } from '@/theme';

<View sx={flex.center} />    // Center items
<View sx={flex.between} />   // Space between
<View sx={flex.row} />       // Flex row
<View sx={flex.column} />    // Flex column
<View sx={flex.wrap} />      // Flex wrap
```

### Position

```tsx
import { position } from '@/theme';

<View sx={position.absolute} />      // Absolute positioning
<View sx={position.absoluteFill} />  // Fill parent
```

### Layout

```tsx
import { layout } from '@/theme';

<View sx={layout.fullWidth} />       // 100% width
<View sx={layout.fullHeight} />      // 100% height
<View sx={layout.fullScreen} />      // 100% width & height
<View sx={layout.container} />       // Container padding
```

### Border

```tsx
import { border } from '@/theme';

<View sx={border.all} />      // All borders
<View sx={border.top} />      // Top border only
<View sx={border.bottom} />   // Bottom border only
```

### Text

```tsx
import { text } from '@/theme';

<Text sx={text.center} />     // Center text
<Text sx={text.truncate} />   // Truncate with ellipsis
```

### Combining Styles

```tsx
import { combine, flex, shadows, createPadding } from '@/theme';

const myStyles = combine(
  flex.center,
  shadows.md,
  createPadding(undefined, 4, 3),  // horizontal: 16px, vertical: 12px
);

<View sx={myStyles} />
```

## Components

### Enhanced Components

#### Card
Unified card component with glass variant.

```tsx
// Default card
<Card>Content</Card>

// Elevated card with shadow
<Card variant="elevated">Content</Card>

// Outlined card
<Card variant="outlined">Content</Card>

// Glass effect card
<Card variant="glass" glassIntensity={20}>Content</Card>

// Custom styling
<Card sx={{ padding: 6, borderRadius: '2xl' }}>Content</Card>
```

#### FormField
Complete form field with label, error, and hint.

```tsx
<FormField
  label="Email"
  placeholder="Enter your email"
  error={errors.email}
  hint="We'll never share your email"
  required
  value={email}
  onChangeText={setEmail}
/>
```

#### ListItem
Reusable list item structure.

```tsx
<ListItem
  left={<Icon name="user" />}
  title="John Doe"
  subtitle="john@example.com"
  description="Active 5 minutes ago"
  right={<Badge>Admin</Badge>}
  onPress={() => {}}
/>

// Or with custom children
<ListItem
  left={<Avatar />}
  onPress={() => {}}
>
  <CustomContent />
</ListItem>
```

#### Badge
Label and tag component.

```tsx
<Badge variant="success" size="md">Active</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="primary" size="lg">Featured</Badge>
```

#### IconButton
Icon-only button.

```tsx
<IconButton variant="primary" size="md" onPress={() => {}}>
  <Icon name="heart" />
</IconButton>
```

#### Skeleton
Loading skeleton with shimmer.

```tsx
<Skeleton width={200} height={20} borderRadius="md" />
<Skeleton width="100%" height={40} />
```

#### Spacer
Add space between elements.

```tsx
<Spacer size={4} />                  // Vertical space (16px)
<Spacer size={4} horizontal />       // Horizontal space (16px)
<Spacer size={SPACING.LG} />        // Using constants
```

#### Separator
Visual separator.

```tsx
<Separator orientation="horizontal" />
<Separator orientation="vertical" />
```

### Existing Components

All existing components remain compatible:
- `Box`, `Text`, `Button`, `TextInput`
- `Stack`, `StatusBadge`, `LabelValue`, `Divider`
- `TouchableOpacity`, `SafeAreaView`, `ScrollView`

## Best Practices

### 1. Use Constants
```tsx
// ❌ Don't
<View sx={{ padding: 16, marginBottom: 12 }} />

// ✅ Do
<View sx={{ padding: LAYOUT.CONTAINER_PADDING, marginBottom: SPACING.MD }} />
```

### 2. Use Hooks for Colors
```tsx
// ❌ Don't
const { theme } = useDripsyTheme();
const color = theme.colors.primary;

// ✅ Do
const { primary } = useColors();
```

### 3. Use Style Utilities
```tsx
// ❌ Don't
<View sx={{
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
}} />

// ✅ Do
<View sx={combine(flex.center, shadows.md)} />
```

### 4. Prefer Card Variants
```tsx
// ❌ Don't (old way)
<GlassCard intensity={20}>Content</GlassCard>

// ✅ Do (new way)
<Card variant="glass" glassIntensity={20}>Content</Card>
```

### 5. Use FormField for Inputs
```tsx
// ❌ Don't
<>
  <Text>Email</Text>
  <TextInput />
  {error && <Text>{error}</Text>}
</>

// ✅ Do
<FormField label="Email" error={error} />
```

### 6. Use Stack for Layouts
```tsx
// ❌ Don't
<View sx={{ flexDirection: 'row', gap: 8 }}>
  <Component1 />
  <Component2 />
</View>

// ✅ Do
<Stack direction="row" spacing={SPACING.SM}>
  <Component1 />
  <Component2 />
</Stack>
```

### 7. Use ListItem for Cards
```tsx
// ❌ Don't
<Card>
  <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
    <Icon />
    <View sx={{ flex: 1, marginLeft: 12 }}>
      <Text variant="body">{title}</Text>
      <Text variant="sm">{subtitle}</Text>
    </View>
    <Badge />
  </View>
</Card>

// ✅ Do
<Card>
  <ListItem
    left={<Icon />}
    title={title}
    subtitle={subtitle}
    right={<Badge />}
  />
</Card>
```

## Migration Guide

### From GlassCard to Card

```tsx
// Before
<GlassCard intensity={20}>
  {content}
</GlassCard>

// After
<Card variant="glass" glassIntensity={20}>
  {content}
</Card>
```

### From Manual Styling to Utilities

```tsx
// Before
<View style={{
  backgroundColor: theme.colors.surface,
  padding: 16,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
}}>

// After
<Card variant="elevated" sx={{ padding: LAYOUT.CARD_PADDING }}>
```

### From Inline Colors to Hooks

```tsx
// Before
const { theme } = useDripsyTheme();
<Text style={{ color: theme.colors.primary }}>

// After
const { primary } = useColors();
<Text sx={{ color: primary }}>
```
