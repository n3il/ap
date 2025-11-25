// useAnimationKey.ts
import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

export function useAnimationKey() {
  const isFocused = useIsFocused();
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isFocused) {
      setKey(k => k + 1);
    }
  }, [isFocused]);

  return key;
}
