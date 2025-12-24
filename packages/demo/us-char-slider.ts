import { BA63 } from "ba63";
import { clamp, clearOnExit } from "./utils";

// TODO: Add carousel wrapping.

const DEBOUNCE_DELAY = 50;

const ba = await BA63.create();

await ba.clearDisplay();

clearOnExit(ba);

// from space character to end of extended ASCII table
const START = 32;
const END = 255;
const charArray = Array.from(Array(256).keys()).slice(START, END + 1);

let currentCharIndex = 65 - START; // start with 'A'
let debounceTimer: NodeJS.Timeout | null = null;

async function renderHeader() {
  await ba.setCursorPosition(0, 0);
  await ba.deleteToEOL();
  const currentCharCode = START + currentCharIndex;
  const header = `Chars ${currentCharCode}-${Math.min(
    END,
    currentCharCode + 19
  )}`;
  await ba.renderInCenter(header);
}

async function renderChars(modifier?: number) {
  console.log(`currentCharIndex: ${currentCharIndex}, modifier: ${modifier}`);
  const newCharCode = clamp(
    currentCharIndex + (modifier || 0),
    0,
    END - START - 19
  );
  // force a render if modifier is explicitly 0
  if (newCharCode === currentCharIndex && modifier !== 0) {
    return;
  }
  currentCharIndex = newCharCode;
  await ba.setCursorPosition(1, 0);
  await ba.deleteToEOL();
  const charCodesToRender: number[] = charArray.slice(
    currentCharIndex,
    currentCharIndex + 20
  );
  const remainingSpaces = 20 - charCodesToRender.length;
  if (remainingSpaces > 0) {
    charCodesToRender.push(charArray.slice(0, remainingSpaces).shift()!);
  }
  console.log(
    `Rendering char codes (len ${charCodesToRender.length}):\n`,
    charCodesToRender
  );
  await ba.render(charCodesToRender);
  await renderHeader();
}

process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");

process.stdin.on("data", async (key: string) => {
  if (key === "\u0003" || key === "q" || key === "\u001b") {
    // Ctrl+C, Q, or ESC
    ba.clearDisplay();
    console.log("Exiting...");
    process.exit();
  } else if (["a", "d", "\u001b[C", "\u001b[D"].includes(key)) {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      if (key === "d") {
        await renderChars(1);
      } else if (key === "a") {
        await renderChars(-1);
      } else if (key === "\u001b[C") {
        await renderChars(10);
      } else if (key === "\u001b[D") {
        await renderChars(-10);
      }
      debounceTimer = null;
    }, DEBOUNCE_DELAY);
  }
});

await renderChars(0);
await renderHeader();
