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

// Playlist Progress Tracking

export interface PlaylistProgress {
  playlistId: string;
  currentTrackId: string;
  currentTime: number; // in seconds
}

export interface PlaylistStats {
  completedTracks: string[];
  totalTracks: number;
  dayCompleted: boolean;
}

export interface DailyStats {
  [playlistId: string]: PlaylistStats;
}

const PROGRESS_KEY = 'playlistProgress';
const STATS_KEY = 'playlistStats';

export function saveProgress(playlistId: string, trackId: string, time: number): void {
  const stored = localStorage.getItem(PROGRESS_KEY);
  const allProgress: Record<string, PlaylistProgress> = stored ? JSON.parse(stored) : {};
  
  allProgress[playlistId] = {
    playlistId,
    currentTrackId: trackId,
    currentTime: time,
  };
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
}

export function loadProgress(playlistId: string): PlaylistProgress | null {
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (!stored) return null;
  
  const allProgress: Record<string, PlaylistProgress> = JSON.parse(stored);
  return allProgress[playlistId] || null;
}

export function clearProgress(playlistId?: string): void {
  if (playlistId) {
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (!stored) return;
    
    const allProgress: Record<string, PlaylistProgress> = JSON.parse(stored);
    delete allProgress[playlistId];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } else {
    localStorage.removeItem(PROGRESS_KEY);
  }
}

export function markTrackComplete(playlistId: string, trackId: string, totalTracks: number): void {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const stored = localStorage.getItem(STATS_KEY);
  const allStats: Record<string, DailyStats> = stored ? JSON.parse(stored) : {};
  
  if (!allStats[today]) {
    allStats[today] = {};
  }
  
  if (!allStats[today][playlistId]) {
    allStats[today][playlistId] = {
      completedTracks: [],
      totalTracks,
      dayCompleted: false,
    };
  }
  
  const playlistStats = allStats[today][playlistId];
  
  // Add track if not already completed
  if (!playlistStats.completedTracks.includes(trackId)) {
    playlistStats.completedTracks.push(trackId);
  }
  
  // Update totals
  playlistStats.totalTracks = totalTracks;
  
  // Check if day is completed
  if (playlistStats.completedTracks.length >= totalTracks) {
    playlistStats.dayCompleted = true;
  }
  
  localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
}

export function getDailyStats(playlistId: string, date?: string): PlaylistStats | null {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(STATS_KEY);
  if (!stored) return null;
  
  const allStats: Record<string, DailyStats> = JSON.parse(stored);
  if (!allStats[targetDate]) return null;
  
  return allStats[targetDate][playlistId] || null;
}

export function getAllDailyStats(date?: string): DailyStats | null {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(STATS_KEY);
  if (!stored) return null;
  
  const allStats: Record<string, DailyStats> = JSON.parse(stored);
  return allStats[targetDate] || null;
}

export function isTrackCompleted(playlistId: string, trackId: string, date?: string): boolean {
  const stats = getDailyStats(playlistId, date);
  if (!stats) return false;
  return stats.completedTracks.includes(trackId);
}
