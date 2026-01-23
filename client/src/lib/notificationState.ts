import { Preferences } from "@capacitor/preferences";

const UNREAD_KEY = "hasUnreadNotifications";

export async function setUnread(value: boolean) {
  await Preferences.set({
    key: UNREAD_KEY,
    value: JSON.stringify(value),
  });
}

export async function getUnread(): Promise<boolean> {
  const { value } = await Preferences.get({ key: UNREAD_KEY });
  return value ? JSON.parse(value) : false;
}

export async function clearUnread() {
  await setUnread(false);
}
