import { BA63, blocks } from "ba63";
import { clamp, clearOnExit, wait } from "./utils";

const ba = await BA63.create();

await ba.clearDisplay();

clearOnExit(ba);

// Test char code array

const blockCharCodes = [
  blocks.LIGHT_SHADE,
  blocks.MEDIUM_SHADE_1,
  blocks.FULL,
  blocks.MEDIUM_SHADE_1,
];

await ba.fill(blockCharCodes);

await wait(5000);

// Test string fill

await ba.fill("+-*/");

await wait(5000);

await ba.fill("BA63 :) ");

await wait(5000);

await ba.clearDisplay();
