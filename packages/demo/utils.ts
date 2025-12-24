import type { BA63 } from "ba63";

export async function clearOnExit(ba: BA63, exit?: () => Promise<void>) {
  async function handleExit() {
    await ba.clearDisplay();
    await exit?.();
    process.exit(0);
  }

  process.on("SIGINT", async () => {
    await handleExit();
  });

  process.on("SIGTERM", async () => {
    await handleExit();
  });
}

export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}
