import { Capacitor } from "@capacitor/core";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Preferences } from "@capacitor/preferences";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text;

    try {
      const json = JSON.parse(text);
      if (json.message) {
        message = json.message;
      } else if (json.error) {
        message = json.error;
      }
    } catch {
      // text is not JSON, use status text if it's just general status
      if (!text || text === res.statusText) {
        message = `${res.status}: ${res.statusText}`;
      }
    }

    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }
}

async function getAuthHeaders(url: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

  const isAdminRoute =
    normalizedUrl.startsWith("/admin") ||
    normalizedUrl.startsWith("/api/admin");

  console.log(
    `[AuthDebug] Checking headers for: ${url} | Native: ${Capacitor.isNativePlatform()} | AdminRoute: ${isAdminRoute}`
  );

  if (isAdminRoute) {
    if (Capacitor.isNativePlatform()) {
      // Native: Use Preferences as usual
      const { value: adminToken } = await Preferences.get({
        key: "@app:admin_token",
      });
      console.log(`[AuthDebug] Native Admin Token found: ${!!adminToken}`);
      if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`;
      }
    } else {
      // Web: Read directly from localStorage to match AdminAuthContext
      const adminToken = localStorage.getItem("@app:admin_token");
      console.log(`[AuthDebug] Web Admin Token found: ${!!adminToken}`);
      if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`;
      }
    }
  } else {
    // User App: Continue using Preferences (consistent across web/mobile for app users)
    const { value: userToken } = await Preferences.get({
      key: "@app:user_token",
    });
    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }
  }

  return headers;
}
// const LOCAL_API = "http://localhost:5001";
// const PROD_API = "https://app.drmeghana.com";

// export const API_BASE_URL = Capacitor.isNativePlatform()
//   ? LOCAL_API // 🔥 change to LOCAL when testing
//   : "";

export const API_BASE_URL = Capacitor.isNativePlatform()
  ? "https://app.drmeghana.com"
  : "";

export function getMediaUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit
): Promise<Response> {
  // 1. Clean the URL by removing leading slashes only.
  // We NO LONGER append a trailing slash automatically because backend routes
  // in server/routes.ts are defined without them (e.g., /api/v1/money-calendar).
  const cleanUrl = url.replace(/^\/+/, "");


  const fullUrl = Capacitor.isNativePlatform()
  ? `${API_BASE_URL}/${cleanUrl}`
  : `/${cleanUrl}`;

  // const fullUrl = Capacitor.isNativePlatform()
  //   ? `https://app.drmeghana.com/${cleanUrl}`
  //   : `/${cleanUrl}`;

  // Use 'cleanUrl' for headers to stay consistent
  const authHeaders = await getAuthHeaders(cleanUrl);

  const headers: Record<string, string> = {
    ...authHeaders,
    ...(options?.headers as Record<string, string>),
  };

  let body: BodyInit | null | undefined;

  if (data instanceof FormData) {
    // Content-Type is set automatically by fetch when body is FormData
    body = data;
  } else if (data) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  } else if (options?.body) {
    body = options.body;
  }

  const res = await fetch(fullUrl, {
    ...options,
    method,
    headers,
    body,
    credentials: options?.credentials || "include", // This handles cookies for web
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
      if (
        unauthorizedBehavior === "returnNull" &&
        (error as any).status === 401
      ) {
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
