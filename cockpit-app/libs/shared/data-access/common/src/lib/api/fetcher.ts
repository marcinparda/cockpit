import { z } from 'zod';
import { refreshAccessToken } from '../authentication/api';
import { logoutAndRedirect } from '../authentication/redirect';

interface FetcherArgs<ResponseData> {
  url: string;
  responseDataSchema: z.ZodType<ResponseData>;
  options?: RequestInit;
  /**
   * Whether to redirect to the login page on 401 Unauthorized response.
   * Defaults to true.
   */
  withRedirect?: boolean;
  withCredentials?: boolean;
}

let refreshPromise: Promise<unknown> | null = null;

/**
 * Refresh tokens are single-use, so parallel 401s must share one refresh call.
 * Otherwise the losers present an already-revoked token and get logged out.
 */
function refreshOnce(): Promise<unknown> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function fetcher<ResponseData>({
  url,
  responseDataSchema,
  options = {},
  withRedirect = true,
  withCredentials = true,
}: FetcherArgs<ResponseData>) {
  if (withCredentials) {
    options.credentials = 'include';
  }
  const response = await fetch(url, options);

  if (response.status === 401) {
    try {
      await refreshOnce();
      return fetcher({
        url,
        responseDataSchema,
        options,
        withRedirect: false,
        withCredentials,
      });
    } catch {
      if (withRedirect) {
        await logoutAndRedirect();
      }
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
    );
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    try {
      const parsedData = responseDataSchema.parse(undefined);
      return parsedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          '[ZOD ERROR] Fetch response data validation error for 204 response: ' +
            JSON.stringify(error.message, null, 2),
        );
      }
      throw error;
    }
  }

  const data = await response.json();
  try {
    const parsedData = responseDataSchema.parse(data);
    return parsedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        '[ZOD ERROR] Fetch response data validation error: ' +
          JSON.stringify(error.message, null, 2),
      );
    }
    throw error;
  }
}
