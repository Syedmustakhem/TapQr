import { Alert } from "react-native";

export async function downloadQR(
  _qrRef: any,
  qrName: string
): Promise<boolean> {
  Alert.alert(
    "Download QR",
    `"${qrName}" can be downloaded from the Android/iOS app.`
  );

  return false;
}