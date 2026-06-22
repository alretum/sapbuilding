"use client";

// Lightweight client-side identity. No real auth in the prototype — a player is
// just a name + chosen role tied to a session, remembered in localStorage.

export interface StoredPlayer {
  sessionId: string;
  code: string;
  playerId: string;
  roleId: string;
  name: string;
}

const KEY = "crc:player";

export function savePlayer(player: StoredPlayer): void {
  localStorage.setItem(KEY, JSON.stringify(player));
}

export function loadPlayer(): StoredPlayer | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredPlayer) : null;
  } catch {
    return null;
  }
}

export function clearPlayer(): void {
  localStorage.removeItem(KEY);
}
