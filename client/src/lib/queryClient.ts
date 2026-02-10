import { Capacitor } from "@capacitor/core";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Preferences } from "@capacitor/preferences";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeaders(url: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const normalizedUrl = url.replace(/^\/+/, "/");

  const isAdminRoute = normalizedUrl.startsWith("/admin") || normalizedUrl.startsWith("/api/admin");

  if (isAdminRoute) {
    const { value: adminToken } = await Preferences.get({ key: "@app:admin_token" });
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }
  } else {
    // Check for user token for all other routes, especially API routes
    const { value: userToken } = await Preferences.get({ key: "@app:user_token" });
    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }
  }

  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // 1. Remove leading slashes and ensure a trailing slash
  let cleanUrl = url.replace(/^\/+/, "");
  if (!cleanUrl.endsWith('/')) {
    cleanUrl += '/';
  }

  const fullUrl = Capacitor.isNativePlatform()
    ? `https://app.drmeghana.com/${cleanUrl}`
    : `/${cleanUrl}`;

  // Use 'cleanUrl' for headers to stay consistent
  const authHeaders = await getAuthHeaders(cleanUrl);

  const headers: Record<string, string> = {
    ...authHeaders,
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // This handles cookies for web
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const url = queryKey.join("/") as string;

      // Use apiRequest for proper native platform routing
      try {
        const res = await apiRequest("GET", url);

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        // If it's a 401 and we should return null, do so
        if (unauthorizedBehavior === "returnNull" && error instanceof Error && error.message.includes("401")) {
          return null;
        }
        throw error;
      }
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
