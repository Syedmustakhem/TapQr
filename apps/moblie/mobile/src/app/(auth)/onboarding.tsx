
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const SLIDE_INTERVAL = 2500;

const slides = [
  {
    eyebrow: "WELCOME TO TAPQR",
    title: "Your business.\nOne scan.",
    description:
      "Connect customers to your business with smart QR experiences designed for the way you work.",
    icon: "qr-code-outline" as const,
    accent: "#A78BFA",
    background: "#171321",
    tag: "ONE QR. MANY POSSIBILITIES.",
  },
  {
    eyebrow: "MAKE IT YOURS",
    title: "Create.\nCustomize.\nConnect.",
    description:
      "Create QR codes, make them match your brand, and manage your digital touchpoints in one place.",
    icon: "color-palette-outline" as const,
    accent: "#6C4CF1",
    background: "#F0ECFF",
    tag: "YOUR BRAND, YOUR EXPERIENCE.",
  },
  {
    eyebrow: "GROW WITH INSIGHT",
    title: "Every scan\nmeans something.",
    description:
      "Bring your QR tools together and discover useful insights into how people interact with your codes.",
    icon: "analytics-outline" as const,
    accent: "#34D399",
    background: "#10251E",
    tag: "MAKE EVERY INTERACTION COUNT.",
  },
];

interface ProgressSegmentProps {
  slideIndex: number;
  activeIndex: number;
  accent: string;
  trackColor: string;
  fillColor: string;
}

function ProgressSegment({
  slideIndex,
  activeIndex,
  accent,
  trackColor,
  fillColor,
}: ProgressSegmentProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (slideIndex !== activeIndex) {
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_INTERVAL,
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [activeIndex, progress, slideIndex]);

  const progressWidth =
    slideIndex < activeIndex
      ? "100%"
      : slideIndex === activeIndex
        ? progress.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          })
        : "0%";

  return (
    <View
      style={[
        styles.progressTrack,
        { backgroundColor: trackColor },
      ]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: fillColor || accent,
            width: progressWidth,
          },
        ]}
      />
    </View>
  );
}

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const currentSlide = slides[activeIndex];
  const isLastSlide = activeIndex === slides.length - 1;
  const isLightSlide = activeIndex === 1;

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      setActiveIndex((current) => {
        if (current < slides.length - 1) {
          return current + 1;
        }

        return current;
      });
    }, SLIDE_INTERVAL);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [activeIndex]);

  function goToSlide(index: number) {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    if (index >= slides.length) {
      router.replace("/(auth)/login");
      return;
    }

    Animated.sequence([
      Animated.timing(fade, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveIndex(index);
  }

  function finishOnboarding() {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: currentSlide.background },
      ]}
    >
      <StatusBar
        barStyle={isLightSlide ? "dark-content" : "light-content"}
        backgroundColor={currentSlide.background}
      />

      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text
            style={[
              styles.brand,
              { color: isLightSlide ? "#171321" : "#FFFFFF" },
            ]}
          >
            TapQR<Text style={styles.brandDot}>.</Text>
          </Text>

          <Pressable
            onPress={finishOnboarding}
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            hitSlop={12}
          >
            <Text
              style={[
                styles.skip,
                { color: isLightSlide ? "#686475" : "#B7B2C4" },
              ]}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          {slides.map((slide, index) => (
            <ProgressSegment
              key={`${slide.eyebrow}-${activeIndex}`}
              slideIndex={index}
              activeIndex={activeIndex}
              accent={slide.accent}
              trackColor={
                isLightSlide ? "#D9D4E8" : "rgba(255,255,255,0.18)"
              }
              fillColor={isLightSlide ? "#6C4CF1" : slide.accent}
            />
          ))}
        </View>

        <Animated.View style={[styles.main, { opacity: fade }]}>
          <View
            style={[
              styles.artwork,
              {
                backgroundColor: isLightSlide
                  ? "#FFFFFF"
                  : "rgba(255,255,255,0.06)",
                borderColor: isLightSlide
                  ? "#E7E2F3"
                  : "rgba(255,255,255,0.12)",
              },
            ]}
          >
            <View
              style={[
                styles.artworkGlow,
                { backgroundColor: `${currentSlide.accent}22` },
              ]}
            />

            <View
              style={[
                styles.iconFrame,
                { backgroundColor: `${currentSlide.accent}20` },
              ]}
            >
              <Ionicons
                name={currentSlide.icon}
                size={72}
                color={currentSlide.accent}
              />
            </View>

            <View
              style={[
                styles.artworkBadge,
                {
                  backgroundColor: currentSlide.accent,
                  borderColor: currentSlide.background,
                },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={19}
                color={isLightSlide ? "#FFFFFF" : "#111111"}
              />
            </View>

            <Text
              style={[
                styles.artworkTag,
                { color: isLightSlide ? "#777184" : "#C2BDCF" },
              ]}
            >
              {currentSlide.tag}
            </Text>
          </View>

          <View style={styles.copy}>
            <Text
              style={[
                styles.eyebrow,
                { color: currentSlide.accent },
              ]}
            >
              {currentSlide.eyebrow}
            </Text>

            <Text
              style={[
                styles.title,
                { color: isLightSlide ? "#171321" : "#FFFFFF" },
              ]}
            >
              {currentSlide.title}
            </Text>

            <Text
              style={[
                styles.description,
                { color: isLightSlide ? "#686475" : "#B7B2C4" },
              ]}
            >
              {currentSlide.description}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.bottom}>
          <View style={styles.bottomMeta}>
            <Text
              style={[
                styles.slideCount,
                { color: isLightSlide ? "#777184" : "#8E899D" },
              ]}
            >
              0{activeIndex + 1} / 0{slides.length}
            </Text>

            <Text
              style={[
                styles.autoText,
                { color: isLightSlide ? "#777184" : "#8E899D" },
              ]}
            >
              INTRODUCING TAPQR
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              isLastSlide
                ? finishOnboarding()
                : goToSlide(activeIndex + 1)
            }
            accessibilityRole="button"
          >
            <Text style={styles.nextButtonText}>
              {isLastSlide ? "Get started" : "Continue"}
            </Text>

            <Ionicons
              name={isLastSlide ? "arrow-forward" : "chevron-forward"}
              size={19}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 12,
    paddingBottom: 18,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -1,
  },
  brandDot: {
    color: "#6C4CF1",
  },
  skip: {
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 8,
    paddingLeft: 12,
  },
  progressRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 25,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  artwork: {
    height: Math.min(width * 0.73, 310),
    borderWidth: 1,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  artworkGlow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  iconFrame: {
    width: 150,
    height: 150,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  artworkBadge: {
    position: "absolute",
    top: "29%",
    right: "25%",
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  artworkTag: {
    position: "absolute",
    bottom: 24,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.7,
    textAlign: "center",
  },
  copy: {
    marginTop: 31,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 13,
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.4,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 340,
  },
  bottom: {
    gap: 17,
  },
  bottomMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slideCount: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  autoText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  nextButton: {
    minHeight: 56,
    paddingHorizontal: 22,
    borderRadius: 17,
    backgroundColor: "#6C4CF1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
