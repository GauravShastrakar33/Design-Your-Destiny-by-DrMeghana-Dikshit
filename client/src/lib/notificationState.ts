import { Preferences } from "@capacitor/preferences";

const UNREAD_COUNT_KEY = "unreadNotificationCount";
const LAST_SEEN_ID_KEY = "lastSeenNotificationId";

export async function setUnreadCount(count: number) {
  await Preferences.set({
    key: UNREAD_COUNT_KEY,
    value: JSON.stringify(count),
  });

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
