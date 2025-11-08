import React from 'react';
import { withOpacity, useColors } from '@/theme';
import Image from './Image';
import View from './View';
import Text from './Text';

/**
 * Size variants for Avatar component
 */
const AVATAR_SIZES = {
  xs: { size: 8, fontSize: 12, lineHeight: 8, nameSize: 14, emailSize: 12 },
  sm: { size: 28, fontSize: 12, lineHeight: 12, nameSize: 16, emailSize: 13 },
  md: { size: 64, fontSize: 22, lineHeight: 26, nameSize: 18, emailSize: 14 },
  lg: { size: 96, fontSize: 30, lineHeight: 36, nameSize: 24, emailSize: 16 },
  xl: { size: 128, fontSize: 42, lineHeight: 50, nameSize: 28, emailSize: 18 },
};

/**
 * Avatar Component
 *
 * @param {Object} props
 * @param {string} props.imgSrc - Image URL for avatar
 * @param {string} props.backgroundColor - Background color (will be applied with opacity)
 * @param {string} props.name - User's full name
 * @param {string} props.email - User's email (fallback for initials)
 * @param {string} props.size - Size variant: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} props.showDetails - Show name/email beside avatar (default: true if name/email provided)
 *
 * @example
 * <Avatar name="John Doe" email="john@example.com" size="sm" />
 * <Avatar imgSrc="https://..." backgroundColor="success" size="lg" />
 * <Avatar name="Jane" size="xs" showDetails={false} />
 */
export default function Avatar({
  imgSrc,
  backgroundColor,
  name,
  email,
  size = 'lg',
  showDetails = true,
}) {
  // Get size configuration
  const sizeConfig = AVATAR_SIZES[size] || AVATAR_SIZES.lg;
  const { size: avatarSize, fontSize, lineHeight, nameSize, emailSize } = sizeConfig;
  const { colors: palette } = useColors();
  const fallbackColor = palette.brand500 ?? palette.primary ?? palette.accent ?? palette.surfaceSecondary;
  const resolvedBackground = backgroundColor ?? fallbackColor;

  const getInitials = (name, email) => {
    if (name) {
      const names = name.split(' ');
      return names.map(n => n[0]).join('').toUpperCase().slice(0, 1);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const shouldShowDetails = showDetails && (name || email);

  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>

      <View
        sx={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: 'full',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: withOpacity(resolvedBackground, 0.7),
          borderWidth: 0,
          borderColor: resolvedBackground,
        }}
      >
        {imgSrc ? (
          <Image
            source={{ uri: imgSrc }}
            style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          />
        ) : (
          (name || email) ? (
            <Text sx={{ fontSize, fontWeight: '700', color: 'foreground', lineHeight }}>
              {getInitials(name, email)}
            </Text>
          ) : null
        )}
      </View>


      {shouldShowDetails && (
        <View sx={{ marginLeft: size === 'xs' ? 2 : size === 'sm' ? 3 : 4, flex: 1, justifyContent: 'center' }}>
          {name && (
            <Text sx={{ fontSize: nameSize, fontWeight: '700', color: 'textPrimary', marginBottom: 0.5 }}>
              {name}
            </Text>
          )}
          {email && (
            <Text sx={{ fontSize: emailSize, color: 'textSecondary' }}>
              {email}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
