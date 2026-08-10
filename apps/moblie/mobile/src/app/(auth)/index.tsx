import React, { useRef, useState } from "react";

import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  colors,
} from "../../constants/colors";

const { width } = Dimensions.get("window");

type IconName =
  React.ComponentProps<
    typeof Ionicons
  >["name"];

type OnboardingSlide = {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  badge: string;
};

const slides: OnboardingSlide[] = [
  {
    id: "1",

    icon: "qr-code-outline",

    title: "Welcome to TapQR",

    description:
      "Manage your business with powerful QR codes, simple tools, and useful insights — all from one app.",

    badge: "SMART QR MANAGEMENT",
  },

  {
    id: "2",

    icon: "add-circle-outline",

    title: "Create QR Codes",

    description:
      "Create QR codes for your business in just a few steps. Add your content, customize it, and get your QR ready to share.",

    badge: "CREATE & CUSTOMIZE",
  },

  {
    id: "3",

    icon: "share-social-outline",

    title: "Connect With Customers",

    description:
      "Put your QR codes on menus, products, posters, cards, packaging, or anywhere your customers can scan.",

    badge: "SHARE EVERYWHERE",
  },

  {
    id: "4",

    icon: "analytics-outline",

    title: "Track Your Performance",

    description:
      "See how your QR codes perform with scan activity, customer engagement, and useful analytics.",

    badge: "POWERFUL ANALYTICS",
  },

  {
    id: "5",

    icon: "business-outline",

    title: "Manage Everything",

    description:
      "Manage your QR codes, business information, activity, notifications, and account from one simple dashboard.",

    badge: "ONE SIMPLE APP",
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] =
    useState(0);

  const flatListRef =
    useRef<FlatList>(null);

  const isLastSlide =
    currentIndex ===
    slides.length - 1;

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offset =
      event.nativeEvent.contentOffset.x;

    const index = Math.round(
      offset / width
    );

    if (
      index !== currentIndex &&
      index >= 0 &&
      index < slides.length
    ) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (isLastSlide) {
      router.push("/(auth)/register");
      return;
    }

    const nextIndex =
      currentIndex + 1;

    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });

    setCurrentIndex(nextIndex);
  };

  const handleSkip = () => {
    router.push("/(auth)/login");
  };

  const handleCreateAccount = () => {
    router.push("/(auth)/register");
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.logo}>
          TapQR
        </Text>

        {!isLastSlide && (
          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ONBOARDING */}

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>

            {/* ICON AREA */}

            <View style={styles.visualContainer}>

              <View style={styles.outerCircle}>
                <View style={styles.middleCircle}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={item.icon}
                      size={72}
                      color={colors.primary}
                    />
                  </View>
                </View>
              </View>

              {/* Decorative elements */}

              <View
                style={[
                  styles.decorCircle,
                  styles.decorTop,
                ]}
              />

              <View
                style={[
                  styles.decorCircle,
                  styles.decorBottom,
                ]}
              />

              <View
                style={[
                  styles.decorSquare,
                  styles.decorRight,
                ]}
              />

            </View>

            {/* CONTENT */}

            <View style={styles.content}>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.badge}
                </Text>
              </View>

              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.description}>
                {item.description}
              </Text>

            </View>
          </View>
        )}
      />

      {/* DOTS */}

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,

              index === currentIndex
                ? styles.activeDot
                : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* BOTTOM ACTION */}

      <View style={styles.bottomContainer}>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {isLastSlide
              ? "Get Started"
              : "Next"}
          </Text>

          <Ionicons
            name={
              isLastSlide
                ? "arrow-forward"
                : "arrow-forward-outline"
            }
            size={20}
            color={colors.white}
          />
        </TouchableOpacity>

        {isLastSlide && (
          <>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={handleCreateAccount}
            >
              <Text style={styles.secondaryButtonText}>
                Create Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.7}
              onPress={handleLogin}
            >
              <Text style={styles.loginText}>
                I already have an account
              </Text>
            </TouchableOpacity>
          </>
        )}

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,

    backgroundColor:
      colors.background,
  },

  /* HEADER */

  header: {
    height: 64,

    paddingHorizontal: 24,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  logo: {
    fontSize: 22,

    fontWeight: "800",

    color:
      colors.primary,
  },

  skipButton: {
    paddingVertical: 8,

    paddingHorizontal: 12,
  },

  skipText: {
    fontSize: 15,

    fontWeight: "600",

    color:
      colors.textSecondary,
  },

  /* SLIDE */

  slide: {
    width,

    flex: 1,

    paddingHorizontal: 24,

    alignItems: "center",
  },

  /* VISUAL */

  visualContainer: {
    height: 300,

    width: "100%",

    alignItems: "center",

    justifyContent: "center",

    position: "relative",
  },

  outerCircle: {
    width: 230,

    height: 230,

    borderRadius: 115,

    backgroundColor:
      "#DBEAFE",

    alignItems: "center",

    justifyContent: "center",
  },

  middleCircle: {
    width: 180,

    height: 180,

    borderRadius: 90,

    backgroundColor:
      "#EFF6FF",

    alignItems: "center",

    justifyContent: "center",
  },

  iconCircle: {
    width: 125,

    height: 125,

    borderRadius: 63,

    backgroundColor:
      colors.surface,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,

    borderColor:
      colors.border,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.08,

    shadowRadius: 15,

    elevation: 5,
  },

  decorCircle: {
    position: "absolute",

    borderRadius: 50,

    backgroundColor:
      colors.primary,
  },

  decorTop: {
    width: 14,

    height: 14,

    top: 48,

    left: "24%",
  },

  decorBottom: {
    width: 10,

    height: 10,

    bottom: 42,

    right: "24%",
  },

  decorSquare: {
    position: "absolute",

    width: 14,

    height: 14,

    borderRadius: 4,

    backgroundColor:
      "#93C5FD",
  },

  decorRight: {
    right: "19%",

    top: 95,

    transform: [
      {
        rotate: "20deg",
      },
    ],
  },

  /* CONTENT */

  content: {
    width: "100%",

    alignItems: "center",

    paddingHorizontal: 8,
  },

  badge: {
    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor:
      "#DBEAFE",

    marginBottom: 16,
  },

  badgeText: {
    fontSize: 10,

    fontWeight: "800",

    letterSpacing: 0.8,

    color:
      colors.primary,
  },

  title: {
    fontSize: 30,

    lineHeight: 38,

    fontWeight: "800",

    textAlign: "center",

    color:
      colors.text,

    marginBottom: 12,
  },

  description: {
    fontSize: 16,

    lineHeight: 25,

    textAlign: "center",

    color:
      colors.textSecondary,

    maxWidth: 480,
  },

  /* PAGINATION */

  pagination: {
    height: 36,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,
  },

  dot: {
    height: 7,

    borderRadius: 4,
  },

  activeDot: {
    width: 24,

    backgroundColor:
      colors.primary,
  },

  inactiveDot: {
    width: 7,

    backgroundColor:
      colors.border,
  },

  /* BOTTOM */

  bottomContainer: {
    paddingHorizontal: 24,

    paddingBottom: 24,

    paddingTop: 8,

    gap: 10,
  },

  primaryButton: {
    height: 56,

    borderRadius: 16,

    backgroundColor:
      colors.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,
  },

  primaryButtonText: {
    color:
      colors.white,

    fontSize: 16,

    fontWeight: "700",
  },

  secondaryButton: {
    height: 54,

    borderRadius: 16,

    backgroundColor:
      colors.surface,

    borderWidth: 1,

    borderColor:
      colors.primary,

    alignItems: "center",

    justifyContent: "center",
  },

  secondaryButtonText: {
    color:
      colors.primary,

    fontSize: 16,

    fontWeight: "700",
  },

  loginButton: {
    height: 40,

    alignItems: "center",

    justifyContent: "center",
  },

  loginText: {
    color:
      colors.textSecondary,

    fontSize: 14,

    fontWeight: "600",
  },

});