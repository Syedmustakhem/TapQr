export interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: "OWNER" | "STAFF" | "ADMIN";
  avatar?: string;
  business?: BusinessProfile;
}