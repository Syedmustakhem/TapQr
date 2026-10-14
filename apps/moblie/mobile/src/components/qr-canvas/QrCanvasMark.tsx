import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type Props = {
  size?: number;
};

const MODULES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],

  [6, 0],
  [7, 0],
  [8, 0],
  [6, 1],
  [8, 1],
  [6, 2],
  [7, 2],
  [8, 2],

  [0, 6],
  [1, 6],
  [2, 6],
  [0, 7],
  [2, 7],
  [0, 8],
  [1, 8],
  [2, 8],

  [4, 3],
  [5, 3],
  [3, 4],
  [4, 4],
  [6, 4],
  [4, 5],
  [5, 5],
  [7, 5],
  [3, 6],
  [5, 6],
  [4, 7],
  [5, 8],
  [7, 7],
  [8, 8],
];

export default function QrCanvasMark({
  size = 180,
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      120,
      withSequence(
        withTiming(1, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0.96, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 350,
          easing: Easing.out(Easing.ease),
        })
      )
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        scale: 0.92 + progress.value * 0.08,
      },
    ],
  }));

  const moduleSize = size / 9;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      {MODULES.map(([column, row], index) => (
        <View
          key={`${column}-${row}-${index}`}
          style={[
            styles.module,
            {
              width: moduleSize - 1,
              height: moduleSize - 1,
              left: column * moduleSize,
              top: row * moduleSize,
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.center,
          {
            width: moduleSize * 2,
            height: moduleSize * 2,
            left: moduleSize * 3.5,
            top: moduleSize * 3.5,
            borderRadius: moduleSize * 0.5,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },

  module: {
    position: "absolute",
    borderRadius: 3,
    backgroundColor: "#111111",
  },

  center: {
    position: "absolute",
    backgroundColor: "#6C4CF1",
  },
});