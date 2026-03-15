import { Preferences } from "@capacitor/preferences";
import { apiRequest } from "@/lib/queryClient";

export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await apiRequest("GET", "/api/v1/notifications/unread-count");
    const data = await res.json();
    await setUnreadCount(data.count);
    return data.count;
  } catch (e) {
    console.error("Failed to fetch unread count:", e);
    return getUnreadCount();
  }
}

const UNREAD_COUNT_KEY = "unreadNotificationCount";
const LAST_SEEN_ID_KEY = "lastSeenNotificationId";

export async function setUnreadCount(count: number) {
  const currentCount = await getUnreadCount();
  if (currentCount === count) return;

  await Preferences.set({
    key: UNREAD_COUNT_KEY,
    value: JSON.stringify(count),
  });

  // 🔴 Synchronize App Icon Badge
  try {
    const { Badge } = await import("@capawesome/capacitor-badge");
    if (count > 0) {
      await Badge.set({ count });
      console.log(`📱 [BADGE] Applied count: ${count}`);
    } else {
      await Badge.clear();
      console.log("📱 [BADGE] Cleared");
    }
  } catch (e) {
    console.warn("⚠️ Failed to update native badge", e);
  }

  // 🔴 Notify UI immediately
  window.dispatchEvent(new CustomEvent("unread-changed", { detail: { count } }));
}

export async function getUnreadCount(): Promise<number> {
  const { value } = await Preferences.get({ key: UNREAD_COUNT_KEY });
  return value ? JSON.parse(value) : 0;
}

export async function getLastSeenId(): Promise<number> {
  const { value } = await Preferences.get({ key: LAST_SEEN_ID_KEY });
  return value ? JSON.parse(value) : 0;
}

export async function setLastSeenId(id: number) {
  await Preferences.set({
    key: LAST_SEEN_ID_KEY,
    value: JSON.stringify(id),
  });
}

export async function clearUnread() {
  await setUnreadCount(0);
}

// Keep setUnread for backward compatibility but redirect to setUnreadCount
export async function setUnread(value: boolean) {
  if (value) {
    const current = await getUnreadCount();
    await setUnreadCount(current + 1);
  } else {
    await setUnreadCount(0);
  }
}

export async function getUnread(): Promise<boolean> {
  const count = await getUnreadCount();
  return count > 0;
}
