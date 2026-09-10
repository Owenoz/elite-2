/**
 * Elite Movies — Offline Download Manager
 *
 * Architecture flow (matches diagram):
 *   App → Payment Gateway → verified → Download Media → Local Storage
 *
 * Downloads the archive.org MP4 file to the device's local storage.
 * Tracks progress in real-time. Persists download state in AsyncStorage.
 * Downloaded movies play from local file — no internet needed.
 */

import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DownloadedMovie {
  movieId: number;
  title: string;
  posterUrl: string;
  archiveIdentifier: string;
  localUri: string;           // file:// path on device
  fileSizeBytes: number;
  downloadedAt: string;
  archiveUrl: string;         // original remote URL
}

export interface DownloadProgress {
  movieId: number;
  title: string;
  progress: number;           // 0–1
  bytesDownloaded: number;
  totalBytes: number;
  status: "downloading" | "paused" | "completed" | "failed" | "cancelled";
  error?: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
const DOWNLOADS_KEY  = "elite_downloads_v1";
const DOWNLOAD_DIR   = FileSystem.documentDirectory + "elite_movies/";

// Active download resumable handles (in-memory only)
const activeDownloads: Map<number, FileSystem.DownloadResumable> = new Map();

// ─── Init directory ───────────────────────────────────────────────────────────
async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

// ─── Read/write persisted downloads ──────────────────────────────────────────
async function getStoredDownloads(): Promise<DownloadedMovie[]> {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveDownloads(list: DownloadedMovie[]): Promise<void> {
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start downloading a movie to local storage.
 * Calls onProgress with live progress updates.
 * Resolves with local file URI on completion.
 */
export async function downloadMovie(
  movieId: number,
  title: string,
  archiveUrl: string,
  archiveIdentifier: string,
  posterUrl: string,
  onProgress: (progress: DownloadProgress) => void
): Promise<string> {
  await ensureDir();

  // Build safe filename from title
  const safeName = title.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60);
  const ext      = archiveUrl.split(".").pop()?.split("?")[0] || "mp4";
  const localUri = `${DOWNLOAD_DIR}${movieId}_${safeName}.${ext}`;

  // Check if already downloaded
  const existing = await FileSystem.getInfoAsync(localUri);
  if (existing.exists && (existing as any).size > 0) {
    // Already on disk — update store and return
    await recordDownload(movieId, title, posterUrl, archiveIdentifier, localUri,
      (existing as any).size, archiveUrl);
    onProgress({ movieId, title, progress: 1, bytesDownloaded: (existing as any).size,
      totalBytes: (existing as any).size, status: "completed" });
    return localUri;
  }

  // Create resumable download
  const downloadResumable = FileSystem.createDownloadResumable(
    archiveUrl,
    localUri,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
    (downloadProgressEvent) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgressEvent;
      const progress = totalBytesExpectedToWrite > 0
        ? totalBytesWritten / totalBytesExpectedToWrite
        : 0;
      onProgress({
        movieId,
        title,
        progress,
        bytesDownloaded: totalBytesWritten,
        totalBytes: totalBytesExpectedToWrite,
        status: "downloading",
      });
    }
  );

  // Store handle so we can pause/cancel
  activeDownloads.set(movieId, downloadResumable);

  onProgress({ movieId, title, progress: 0, bytesDownloaded: 0, totalBytes: 0, status: "downloading" });

  try {
    const result = await downloadResumable.downloadAsync();
    activeDownloads.delete(movieId);

    if (!result) throw new Error("Download returned no result");

    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const size = (fileInfo as any).size || 0;

    await recordDownload(movieId, title, posterUrl, archiveIdentifier,
      result.uri, size, archiveUrl);

    onProgress({ movieId, title, progress: 1, bytesDownloaded: size,
      totalBytes: size, status: "completed" });

    return result.uri;

  } catch (err: any) {
    activeDownloads.delete(movieId);
    // Clean up partial file
    try { await FileSystem.deleteAsync(localUri, { idempotent: true }); } catch {}
    onProgress({ movieId, title, progress: 0, bytesDownloaded: 0,
      totalBytes: 0, status: "failed", error: err.message });
    throw err;
  }
}

/** Pause an active download */
export async function pauseDownload(movieId: number): Promise<void> {
  const dl = activeDownloads.get(movieId);
  if (dl) await dl.pauseAsync();
}

/** Cancel and delete a downloading movie */
export async function cancelDownload(movieId: number): Promise<void> {
  const dl = activeDownloads.get(movieId);
  if (dl) {
    await dl.cancelAsync();
    activeDownloads.delete(movieId);
  }
}

/** Delete a downloaded movie from local storage */
export async function deleteDownload(movieId: number): Promise<void> {
  const list    = await getStoredDownloads();
  const entry   = list.find(d => d.movieId === movieId);
  if (entry) {
    try { await FileSystem.deleteAsync(entry.localUri, { idempotent: true }); } catch {}
  }
  const updated = list.filter(d => d.movieId !== movieId);
  await saveDownloads(updated);
}

/** Get all downloaded movies from local storage */
export async function getDownloadedMovies(): Promise<DownloadedMovie[]> {
  const list = await getStoredDownloads();
  // Verify files still exist on disk
  const verified: DownloadedMovie[] = [];
  for (const d of list) {
    try {
      const info = await FileSystem.getInfoAsync(d.localUri);
      if (info.exists) verified.push(d);
    } catch {
      // skip
    }
  }
  if (verified.length !== list.length) await saveDownloads(verified);
  return verified;
}

/** Check if a specific movie is downloaded */
export async function isDownloadedLocally(movieId: number): Promise<string | null> {
  const list  = await getStoredDownloads();
  const entry = list.find(d => d.movieId === movieId);
  if (!entry) return null;
  try {
    const info = await FileSystem.getInfoAsync(entry.localUri);
    return info.exists ? entry.localUri : null;
  } catch {
    return null;
  }
}

/** Get total disk usage of all downloads in MB */
export async function getDownloadsDiskUsage(): Promise<number> {
  const list = await getStoredDownloads();
  return list.reduce((sum, d) => sum + (d.fileSizeBytes || 0), 0) / 1024 / 1024;
}

/** Format bytes to human readable string */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ─── Internal ─────────────────────────────────────────────────────────────────
async function recordDownload(
  movieId: number, title: string, posterUrl: string,
  archiveIdentifier: string, localUri: string,
  fileSizeBytes: number, archiveUrl: string
): Promise<void> {
  const list    = await getStoredDownloads();
  const updated = list.filter(d => d.movieId !== movieId);
  updated.push({
    movieId, title, posterUrl, archiveIdentifier,
    localUri, fileSizeBytes,
    downloadedAt: new Date().toISOString(),
    archiveUrl,
  });
  await saveDownloads(updated);
}
