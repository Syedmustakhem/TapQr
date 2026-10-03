/*
 * --------------------------------------------------------------------------
 * Lightweight GeoIP resolution for scan analytics.
 * --------------------------------------------------------------------------
 *
 * Resolution order:
 *
 *   1. CDN / platform headers (free, instant, no network):
 *      Cloudflare (cf-ipcountry), Vercel (x-vercel-ip-country),
 *      CloudFront (cloudfront-viewer-country).
 *
 *   2. ip-api.com fallback for the country + city (free tier,
 *      ~45 req/min — rate limits or failures degrade to null).
 *
 * Never throws. Scan recording must never break because
 * geolocation failed.
 */

export interface GeoLocation {
  country?: string;
  city?: string;
}

const IP_API_TIMEOUT_MS = 1500;

function readHeader(
  headers: Record<string, unknown>,
  name: string
): string | undefined {
  const value =
    headers[name.toLowerCase()];

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (
    Array.isArray(value) &&
    typeof value[0] === "string"
  ) {
    const trimmed =
      value[0].trim();
    return trimmed || undefined;
  }

  return undefined;
}

function isPublicIp(
  ip: string
): boolean {
  const value = ip.trim();

  if (!value) {
    return false;
  }

  /*
   * Skip private / loopback / link-local ranges —
   * geolocation APIs return nothing useful for them.
   */
  if (
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|0\.0\.0\.0)/.test(
      value
    )
  ) {
    return false;
  }

  if (/^(::1|fc00:|fe80:)/i.test(value)) {
    return false;
  }

  return true;
}

async function lookupIpApi(
  ip: string
): Promise<GeoLocation> {
  const controller =
    new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    IP_API_TIMEOUT_MS
  );

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(
        ip
      )}?fields=status,country,city`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      return {};
    }

    const data =
      (await response.json()) as {
        status?: string;
        country?: string;
        city?: string;
      };

    if (data.status !== "success") {
      return {};
    }

    return {
      country:
        data.country?.trim() ||
        undefined,
      city:
        data.city?.trim() ||
        undefined,
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveGeoLocation(
  headers: Record<string, unknown>,
  ipAddress?: string
): Promise<GeoLocation> {
  const safeHeaders =
    headers ?? {};

  /*
   * 1. CDN headers — instant when the app sits
   *    behind Cloudflare / Vercel / CloudFront.
   */
  const country =
    readHeader(
      safeHeaders,
      "cf-ipcountry"
    ) ??
    readHeader(
      safeHeaders,
      "x-vercel-ip-country"
    ) ??
    readHeader(
      safeHeaders,
      "cloudfront-viewer-country"
    );

  if (country) {
    return { country };
  }

  /*
   * 2. ip-api.com fallback for public IPs only.
   */
  if (
    ipAddress &&
    isPublicIp(ipAddress)
  ) {
    return lookupIpApi(ipAddress);
  }

  return {};
}
