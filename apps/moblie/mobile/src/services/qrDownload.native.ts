import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { Alert, View } from "react-native";

export async function downloadQR(
  qrRef: React.RefObject<View | null>,
  qrName: string
) {
  if (!qrRef.current) {
    throw new Error("QR reference is not available.");
  }

  const permission =
    await MediaLibrary.requestPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Permission required",
      "Please allow TapQR to access your photos so the QR code can be saved."
    );

    return false;
  }

  const uri = await captureRef(qrRef, {
    format: "png",
    quality: 1,
  });

  await MediaLibrary.saveToLibraryAsync(uri);

  Alert.alert(
    "QR Code Saved",
    `"${qrName}" has been saved to your device.`
  );

  return true;
}