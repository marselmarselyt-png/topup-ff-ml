export function formatIDR(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const GAME_LABELS: Record<string, string> = {
  FF: "Free Fire",
  ML: "Mobile Legends",
};

export function gameLabel(game: string): string {
  return GAME_LABELS[game] ?? game;
}
