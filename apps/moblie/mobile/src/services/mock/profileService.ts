import { UserProfile } from "../../types/profile";

const mockProfile: UserProfile = {
  id: "user_001",

  fullName: "TapQR Owner",

  email: "owner@tapqr.app",

  phone: "+91 98765 43210",

  role: "OWNER",

  avatar: undefined,

  business: {
    id: "business_001",

    name: "TapQR Demo Business",

    category: "Restaurant",

    description:
      "A modern business powered by TapQR.",

    email: "business@tapqr.app",

    phone: "+91 98765 43210",

    address: "Kadiri, Andhra Pradesh",
  },
};

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    await new Promise((resolve) =>
      setTimeout(resolve, 600)
    );

    return mockProfile;
  },
};