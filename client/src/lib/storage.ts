export interface SavedPlaylist {
  id: string;
  name: string;
  practices: string[];
  createdAt: string;
  reminderTime?: string; // HH:MM format
}

const PLAYLISTS_KEY = 'dr-m-playlists';

export function getPlaylists(): SavedPlaylist[] {
  const stored = localStorage.getItem(PLAYLISTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function savePlaylist(playlist: Omit<SavedPlaylist, 'id' | 'createdAt'>): SavedPlaylist {
  const playlists = getPlaylists();
  const newPlaylist: SavedPlaylist = {
    ...playlist,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  playlists.push(newPlaylist);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  return newPlaylist;
}

export function deletePlaylist(id: string): void {
  const playlists = getPlaylists();
  const filtered = playlists.filter(p => p.id !== id);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(filtered));
}

export function updatePlaylist(id: string, updates: Partial<SavedPlaylist>): void {
  const playlists = getPlaylists();
  const index = playlists.findIndex(p => p.id === id);
  if (index !== -1) {
    playlists[index] = { ...playlists[index], ...updates };
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
}
