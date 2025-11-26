import React from 'react';
import { Text } from '@/components/ui';
import { formatRelativeDate } from '@/utils/date';

const getActiveDuration = (isActive) => {
  if (!isActive) return null;

  const activeDate = new Date(isActive);
  const diffMs = Date.now() - activeDate.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}d`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo`;
};

export default function ActiveDurationBadge({ isActive, variant = 'small' }) {
  const duration = formatRelativeDate(isActive);

  if (!duration) return null;

  const styles = {
    small: {
      fontSize: 'xs',
      fontWeight: '300',
      color: 'success',
    },
    large: {
      fontSize: 'sm',
      fontWeight: '600',
      color: 'success',
    },
  };

  const variantStyle = styles[variant] || styles.small;

  return (
    <Text variant={variantStyle.fontSize} sx={{ fontWeight: variantStyle.fontWeight, color: variantStyle.color }}>
      active {duration}
    </Text>
  );
}
