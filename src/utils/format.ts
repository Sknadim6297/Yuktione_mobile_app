/** Lightweight display helpers — expand as features land. */

export function formatDisplayName(name: string | null | undefined): string {
  if (!name?.trim()) {
    return 'YuktiOne';
  }
  return name.trim();
}
