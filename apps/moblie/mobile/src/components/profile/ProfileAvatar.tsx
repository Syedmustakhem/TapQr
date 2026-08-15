import React from "react";

import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../constants/colors";

interface ProfileAvatarProps {
  name: string;
  image?: string;
  size?: number;
}

export default function ProfileAvatar({
  name,
  image,
  size = 88,
}: ProfileAvatarProps) {
  const initial =
    name?.charAt(0)?.toUpperCase() || "?";

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <Text
          style={[
            styles.initial,
            {
              fontSize: size * 0.38,
            },
          ]}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    overflow: "hidden",
  },

  initial: {
    fontWeight: "800",
    color: colors.primary,
  },
});