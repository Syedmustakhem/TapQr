import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleProp,
  ViewStyle,
} from "react-native";

interface SlideUpProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export default function SlideUp({
  children,
  duration = 450,
  delay = 0,
  distance = 30,
  style,
}: SlideUpProps) {
  const translateY = useRef(
    new Animated.Value(distance)
  ).current;

  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),

      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, duration, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [
            {
              translateY,
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}