import {
  randomBytes,
  createHash,
} from "crypto";
import { AppError } from "../../cores/errors/AppError";
import { SettingsRepository } from "./settings.repository";
import type {
  UpdatePreferencesInput,
  CreateApiKeyInput,
} from "./settings.validation";

/*
 * ============================================================
 * SETTINGS SERVICE
 * ============================================================
 *
 * Professional account settings: language/timezone
 * preferences and developer API keys (for AgentOS / MCP
 * integrations).
 *
 * API key security:
 *  - Keys are random 256-bit values, shown ONCE at creation.
 *  - Only the SHA-256 hash is stored — a database leak
 *    reveals nothing usable.
 *  - Max 10 active keys per user (abuse bound).
 */

const MAX_ACTIVE_API_KEYS = 10;
const KEY_PREFIX = "tapqr_";

const repository =
  new SettingsRepository();

function generateApiKey(): {
  key: string;
  keyHash: string;
  prefix: string;
} {
  const secret = randomBytes(32).toString(
    "hex"
  );
  const key = `${KEY_PREFIX}${secret}`;

  const keyHash = createHash("sha256")
    .update(key)
    .digest("hex");

  return {
    key,
    keyHash,
    prefix: key.slice(0, 12),
  };
}

export async function getPreferences(
  userId: string
) {
  const prefs =
    await repository.getPreferences(
      userId
    );

  if (!prefs) {
    throw new AppError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return prefs;
}

export async function updatePreferences(
  userId: string,
  input: UpdatePreferencesInput
) {
  return repository.updatePreferences(
    userId,
    {
      ...(input.language !==
        undefined && {
        language: input.language,
      }),
      ...(input.timezone !==
        undefined && {
        timezone: input.timezone,
      }),
    }
  );
}

export async function listApiKeys(
  userId: string
) {
  return repository.listApiKeys(userId);
}

export async function createApiKey(
  userId: string,
  input: CreateApiKeyInput
) {
  const active =
    await repository.countActiveApiKeys(
      userId
    );

  if (active >= MAX_ACTIVE_API_KEYS) {
    throw new AppError(
      `You can have at most ${MAX_ACTIVE_API_KEYS} active API keys. Revoke one first.`,
      400,
      "API_KEY_LIMIT_REACHED"
    );
  }

  const { key, keyHash, prefix } =
    generateApiKey();

  const expiresAt = input.expiresInDays
    ? new Date(
        Date.now() +
          input.expiresInDays *
            24 *
            60 *
            60 *
            1000
      )
    : null;

  const record =
    await repository.createApiKey({
      userId,
      name: input.name,
      keyHash,
      prefix,
      expiresAt,
    });

  // The plaintext key is returned ONCE — never stored.
  return {
    ...record,
    key,
  };
}

export async function revokeApiKey(
  userId: string,
  keyId: string
) {
  const revoked =
    await repository.revokeApiKey(
      userId,
      keyId
    );

  if (!revoked) {
    throw new AppError(
      "API key not found or already revoked.",
      404,
      "API_KEY_NOT_FOUND"
    );
  }

  return { revoked: true };
}
