// Browser-side wording for the server limits (see rate-limit.ts).

export function isLimitError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("Limit:");
}

export function limitMessage(err: unknown, what: string): string {
  const reason = err instanceof Error ? err.message.replace("Limit:", "").trim() : "";
  if (reason === "daily") return `The demo has reached its daily limit for ${what}. Please try again tomorrow.`;
  if (reason === "paused") return `The demo is not running ${what} right now.`;
  return `You have reached the demo limit for ${what} for now. Please try again later.`;
}
