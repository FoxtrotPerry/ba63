import { BA63 } from "ba63";
import { clearOnExit } from "./utils";

const ba = await BA63.create();

await ba.clearDisplay();

clearOnExit(ba);

// from space character to end of extended ASCII table
const START = 32;
const END = 255;
const charArray = Array.from(Array(256).keys()).slice(START, END + 1);

let currentCharCode = 65; // Start with 'A'

function renderChar() {

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", (key: string) => {
  // Handle keyboard input
  if (key === "\u0003" || key === "q" || key === "\u001b") {
    // Ctrl+C, Q, or ESC
    console.log("\nExiting...\n");
    process.exit();
  } else if (key === "d" || key === "\u001b[C") {
    // D or Right Arrow
    nextChar();
  } else if (key === "a" || key === "\u001b[D") {
    // A or Left Arrow
    prevChar();
  }
});
