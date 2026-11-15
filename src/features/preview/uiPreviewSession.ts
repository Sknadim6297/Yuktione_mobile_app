/**
 * Local UI-preview flag only — not authentication.
 * Never treat this as a Sanctum session.
 */
let uiPreviewUnlocked = false;

export function isUiPreviewUnlocked(): boolean {
  return uiPreviewUnlocked;
}

export function unlockUiPreview(): void {
  uiPreviewUnlocked = true;
}

export function clearUiPreview(): void {
  uiPreviewUnlocked = false;
}
