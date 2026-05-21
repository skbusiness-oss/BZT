export const tosAcceptedKey = (uid: string) => `bzt-tos-accepted-${uid}`;
export const communityBaselineKey = (uid: string) => `bzt-community-baseline-${uid}`;

function readFlag(key: string): boolean {
  try {
    return !!localStorage.getItem(key);
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // Private mode / quota. The server field remains the source of truth.
  }
}

function clearFlag(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Private mode / quota.
  }
}

export const hasLocalTosAccepted = (uid: string) => readFlag(tosAcceptedKey(uid));
export const markLocalTosAccepted = (uid: string) => writeFlag(tosAcceptedKey(uid));
export const clearLocalTosAccepted = (uid: string) => clearFlag(tosAcceptedKey(uid));

export const hasLocalCommunityBaseline = (uid: string) => readFlag(communityBaselineKey(uid));
export const markLocalCommunityBaseline = (uid: string) => writeFlag(communityBaselineKey(uid));
