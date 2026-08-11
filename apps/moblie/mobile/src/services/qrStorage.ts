import AsyncStorage from "@react-native-async-storage/async-storage";

export type QRCode = {
  id: string;
  name: string;
  type: "STATIC" | "DYNAMIC";
  status: "ACTIVE" | "PAUSED";
  scans: number;
  destination: string;
  destinationType: string;
  createdAt: string;
};

const STORAGE_KEY = "@tapqr_qr_codes";

export async function getQRCodes(): Promise<QRCode[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load QR codes:", error);
    return [];
  }
}

export async function saveQRCode(
  qrCode: QRCode
): Promise<QRCode[]> {
  try {
    const existing = await getQRCodes();

    const updated = [qrCode, ...existing];

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    return updated;
  } catch (error) {
    console.error("Failed to save QR code:", error);
    throw error;
  }
}

export async function deleteQRCode(
  id: string
): Promise<QRCode[]> {
  try {
    const existing = await getQRCodes();

    const updated = existing.filter(
      (qr) => qr.id !== id
    );

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    return updated;
  } catch (error) {
    console.error("Failed to delete QR code:", error);
    throw error;
  }
}

export async function updateQRCode(
  id: string,
  updates: Partial<QRCode>
): Promise<QRCode[]> {
  try {
    const existing = await getQRCodes();

    const updated = existing.map((qr) =>
      qr.id === id
        ? {
            ...qr,
            ...updates,
          }
        : qr
    );

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    return updated;
  } catch (error) {
    console.error("Failed to update QR code:", error);
    throw error;
  }
}

export async function clearQRCodes() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}