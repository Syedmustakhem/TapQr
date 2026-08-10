import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { UserProfile } from "../types/profile";
import { profileService } from "../services/mock/profileService";

export function useProfile() {
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data =
        await profileService.getProfile();

      setProfile(data);
    } catch {
      setError(
        "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    refresh: loadProfile,
  };
}