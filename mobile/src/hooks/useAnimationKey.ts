// useAnimationKey.ts

import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";

export function useAnimationKey() {
  const isFocused = useIsFocused();
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isFocused) {
      setKey((k) => k + 1);
    }
  }, [isFocused]);

  return key;
}
