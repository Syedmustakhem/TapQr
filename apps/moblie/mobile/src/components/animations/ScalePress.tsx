import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";

interface ScalePressProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function ScalePress({
  children,
  onPress,
  style,
}: ScalePressProps) {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale }],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}