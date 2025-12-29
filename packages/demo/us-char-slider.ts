import { BA63, charset } from "ba63";
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
const STARTING_CHARSET = charset.USA;
const STARTING_CHAR_IDX = 65 - START; // 'A'

let currentCharIndex = STARTING_CHAR_IDX;
let currentCharset: (typeof charset)[keyof typeof charset] = STARTING_CHARSET;
let debounceTimer: NodeJS.Timeout | null = null;

async function renderHeader() {
  await ba.setCursorPosition(0, 0);
  await ba.deleteToEOL();
  const currentCharCode = START + currentCharIndex;
  const charRange = `Chars ${currentCharCode}-${Math.min(
    END,
    currentCharCode + 19
  )}`;
  await Promise.all([
    ba.renderLeft(`CS: ${currentCharset}`),
    ba.renderRight(charRange),
  ]);
}

async function changeCharset(modifier: number) {
  const charsetCodes = Object.values(charset);
  const charsetNames = Object.keys(charset);
  const currentIndex = charsetCodes.indexOf(currentCharset);
  const newIndex = currentIndex + (modifier % charsetCodes.length);
  const newCharset = charsetCodes.at(newIndex);
  if (newCharset === undefined) {
    console.warn("No charset found for index:", newIndex);
    return;
  }
  currentCharset = newCharset;
  console.log(
    `Switching to charset code ${newCharset} (${charsetNames.at(newIndex)})`
  );
  await ba.setCharset(newCharset);
  await ba.clearDisplay();
}

async function render(modifier?: number) {
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
  await ba.render(charCodesToRender);
  await renderHeader();
  console.log(`Rendered char codes:`, charCodesToRender);
}

process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");

process.stdin.on("data", async (key: string) => {
  // Ctrl+C, Q, or ESC to exit
  if (key === "\u0003" || key === "q" || key === "\u001b") {
    await ba.clearDisplay();
    console.log("Exiting...");
    process.exit();
  } else if (["a", "d", "\u001b[C", "\u001b[D", "w", "s"].includes(key)) {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      if (key === "d") {
        await render(1);
      } else if (key === "a") {
        await render(-1);
      } else if (key === "w") {
        currentCharIndex = STARTING_CHAR_IDX;
        await changeCharset(1);
        await render(0);
      } else if (key === "s") {
        currentCharIndex = STARTING_CHAR_IDX;
        await changeCharset(-1);
        await render(0);
      } else if (key === "\u001b[C") {
        await render(10);
      } else if (key === "\u001b[D") {
        await render(-10);
      }
      debounceTimer = null;
    }, DEBOUNCE_DELAY);
  }
});

await render(0);
await renderHeader();
