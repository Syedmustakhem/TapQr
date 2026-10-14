import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
     router.replace("/(auth)/onboarding");
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoMark}>
        <Text style={styles.logoSymbol}>⌗</Text>
      </View>

      <Text style={styles.logo}>TapQR</Text>
      <Text style={styles.tagline}>One tap. Endless possibilities.</Text>

      <View style={styles.loader}>
        <View style={styles.loaderDot} />
        <View style={styles.loaderDot} />
        <View style={styles.loaderDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#6C4CF1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoSymbol: {
    color: "#FFFFFF",
    fontSize: 43,
    fontWeight: "800",
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  tagline: {
    color: "#A5A5B0",
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  loader: {
    flexDirection: "row",
    gap: 7,
    marginTop: 48,
  },
  loaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6C4CF1",
  },
});
