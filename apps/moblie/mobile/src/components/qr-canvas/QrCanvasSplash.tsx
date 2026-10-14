import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import QrCanvasMark from "./QrCanvasMark";

type Props = {
  onFinish: () => void;
};

export default function QrCanvasSplash({
  onFinish,
}: Props) {
  const logoOpacity = useSharedValue(0);
  const logoTranslate = useSharedValue(12);
  const taglineOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });

    logoTranslate.value = withTiming(0, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });

    taglineOpacity.value = withDelay(
      550,
      withTiming(1, {
        duration: 550,
        easing: Easing.out(Easing.cubic),
      })
    );

    screenOpacity.value = withDelay(
      1900,
      withTiming(
        0,
        {
          duration: 350,
          easing: Easing.inOut(Easing.ease),
        },
        (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        }
      )
    );
  }, [
    logoOpacity,
    logoTranslate,
    taglineOpacity,
    screenOpacity,
    onFinish,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      {
        translateY: logoTranslate.value,
      },
    ],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.logo, logoStyle]}>
          TAPQR
        </Animated.Text>

        <View style={styles.mark}>
          <QrCanvasMark size={150} />
        </View>

        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>
            One Scan.
          </Text>

          <Text style={styles.taglineSecondary}>
            Everything.
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
...StyleSheet.absoluteFill,    zIndex: 9999,

    backgroundColor: "#F7F7F5",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#111111",
  },

  mark: {
    marginTop: 36,
    marginBottom: 36,
  },

  tagline: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    color: "#111111",
    letterSpacing: 0.2,
  },

  taglineSecondary: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "400",
    textAlign: "center",
    color: "#6B6B6B",
    letterSpacing: 0.2,
  },
});