import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../constants/theme";

export default function ScreenLoader() {
  const opacity = useRef(
    new Animated.Value(0.5)
  ).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),

        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity }}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </Animated.View>

      <Text style={styles.text}>
        Loading notifications...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    marginTop: 12,
    color: colors.textSecondary,
  },
});