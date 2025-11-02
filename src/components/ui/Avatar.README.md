# Avatar Component

A flexible avatar component with size variants, image support, and automatic initials generation.

## Features

- ✅ **5 size variants** - xs, sm, md, lg, xl
- ✅ **Image support** - Display user profile images
- ✅ **Automatic initials** - Generates from name or email
- ✅ **Optional details** - Show/hide name and email
- ✅ **Custom colors** - Background color with automatic opacity
- ✅ **Responsive scaling** - All elements scale with size

## Size Variants

| Size | Avatar | Font | Name | Email | Use Case |
|------|--------|------|------|-------|----------|
| `xs` | 32px | 12px | 14px | 12px | Lists, compact views, inline mentions |
| `sm` | 48px | 16px | 16px | 13px | Cards, comments, activity feeds |
| `md` | 64px | 22px | 18px | 14px | User profiles, modals |
| `lg` | 96px | 30px | 24px | 16px | Profile headers, settings (default) |
| `xl` | 128px | 42px | 28px | 18px | Large profile displays, onboarding |

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imgSrc` | `string` | - | Image URL for avatar |
| `backgroundColor` | `string` | `rgba(99, 102, 241, 0.2)` | Background color (applied with 0.7 opacity) |
| `name` | `string` | - | User's full name |
| `email` | `string` | - | User's email (fallback for initials) |
| `size` | `string` | `'lg'` | Size variant: `'xs'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` |
| `showDetails` | `boolean` | `true` | Show name/email beside avatar |

## Usage Examples

### Basic with Initials
```javascript
import { Avatar } from '@/components/ui';

<Avatar
  name="John Doe"
  size="md"
/>
```

### With Image
```javascript
<Avatar
  imgSrc="https://example.com/avatar.jpg"
  name="Jane Smith"
  size="lg"
/>
```

### With Custom Color
```javascript
import { PROVIDER_COLORS } from '@/factories/mockAgentData';

<Avatar
  backgroundColor={PROVIDER_COLORS.openai}
  name="GPT-4 Agent"
  size="sm"
/>
```

### Icon Only (No Details)
```javascript
<Avatar
  name="John Doe"
  size="xs"
  showDetails={false}
/>
```

### Email Fallback
```javascript
<Avatar
  email="user@example.com"
  size="md"
/>
// Shows "US" initials
```

### All Props
```javascript
<Avatar
  imgSrc="https://..."
  backgroundColor="#34d399"
  name="Alice Johnson"
  email="alice@example.com"
  size="lg"
  showDetails={true}
/>
```

## Real-World Examples

### Assessment Card (Compact)
```javascript
<Avatar
  backgroundColor={PROVIDER_COLORS[agent.llm_provider]}
  name={agent.name}
  email={agent.email}
  size="sm"
/>
```

### Profile Screen (Large)
```javascript
<Avatar
  imgSrc={user.avatar_url}
  name={user.full_name}
  email={user.email}
  size="lg"
/>
```

### Comment List (Extra Small)
```javascript
<Avatar
  name={comment.author}
  size="xs"
  showDetails={false}
/>
```

### User Selector (Medium with Details)
```javascript
<Avatar
  name={user.name}
  email={user.email}
  size="md"
  backgroundColor={user.color}
/>
```

## Initials Generation Logic

1. **From Name**: Takes first letter of each word (max 2)
   - "John Doe" → "JD"
   - "Alice" → "AL"

2. **From Email**: Takes first 2 characters
   - "user@example.com" → "US"

3. **Fallback**: Shows "U" if no name/email

## Styling

### Colors
- **Default background**: `rgba(99, 102, 241, 0.2)` (light indigo)
- **Custom background**: Applied with 0.7 opacity via `withOpacity()`
- **Initials color**: `#818cf8` (indigo-400)
- **Text colors**: Theme-based (`textPrimary`, `textSecondary`)

### Layout
- Avatar and details are horizontally aligned
- Spacing scales with size (xs: 2, sm: 3, default: 4)
- Details are vertically centered
- Name has 0.5 margin-bottom from email

## Advanced Usage

### With Navigation
```javascript
import { useNavigation, ROUTES } from '@/navigation';

function UserAvatar({ user }) {
  const { navigateTo } = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigateTo(ROUTES.TABS_PROFILE_INDEX)}>
      <Avatar
        imgSrc={user.avatar}
        name={user.name}
        size="sm"
        showDetails={false}
      />
    </TouchableOpacity>
  );
}
```

### With Status Indicator
```javascript
<View style={{ position: 'relative' }}>
  <Avatar name="John Doe" size="md" showDetails={false} />
  <View style={{
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e', // online status
    borderWidth: 2,
    borderColor: '#fff',
  }} />
</View>
```

### In a List
```javascript
function UserList({ users }) {
  return (
    <View>
      {users.map(user => (
        <View key={user.id} style={{ marginBottom: 12 }}>
          <Avatar
            name={user.name}
            email={user.email}
            backgroundColor={user.color}
            size="sm"
          />
        </View>
      ))}
    </View>
  );
}
```

## Component Architecture

```
Avatar
├── Avatar Circle
│   ├── Image (if imgSrc provided)
│   └── Initials (fallback)
└── User Info (optional, if showDetails=true)
    ├── Name
    └── Email
```

## Performance

- Uses native `sx` prop for styling (no StyleSheet overhead)
- Memoizes nothing (stateless, no expensive calculations)
- Minimal re-renders (only when props change)
- Image uses React Native's optimized `Image` component

## Accessibility

- Avatar is decorative, no accessibility labels needed
- Name and email text are readable by screen readers
- Initials provide visual fallback when image fails

## Migration Guide

### From Old Avatar (hardcoded size)
```javascript
// Before
<Avatar name="John" />  // Always 96px

// After
<Avatar name="John" size="lg" />  // Explicit size
<Avatar name="John" size="sm" />  // Can now scale!
```

### From Custom Avatar Implementation
```javascript
// Before
<View style={{ width: 48, height: 48, borderRadius: 24 }}>
  <Text>{getInitials(name)}</Text>
</View>

// After
<Avatar name={name} size="sm" showDetails={false} />
```

## Best Practices

1. **Use appropriate sizes**:
   - `xs`: Inline, lists, activity feeds
   - `sm`: Cards, comments
   - `md`: Modals, forms
   - `lg`: Profile headers
   - `xl`: Onboarding, welcome screens

2. **Provide names over emails**: Better UX and more recognizable initials

3. **Use custom colors meaningfully**: e.g., agent colors, team colors, status colors

4. **Toggle details based on context**:
   - Show details in profile views
   - Hide details in compact lists

5. **Consider loading states**: Show placeholder while fetching user data

## Common Patterns

### User Profile Header
```javascript
<Avatar
  imgSrc={user.avatar_url}
  name={user.full_name}
  email={user.email}
  size="lg"
/>
```

### Compact List Item
```javascript
<Avatar
  name={item.author}
  size="xs"
  showDetails={false}
/>
```

### Agent Card
```javascript
<Avatar
  backgroundColor={PROVIDER_COLORS[agent.provider]}
  name={agent.name}
  size="sm"
/>
```

### Comment Thread
```javascript
<Avatar
  imgSrc={comment.user.avatar}
  name={comment.user.name}
  size="sm"
  showDetails={false}
/>
```
