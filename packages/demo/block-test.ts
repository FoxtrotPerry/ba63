import { BA63 } from "ba63";
import { clearOnExit, wait } from "./utils";

const ba = await BA63.create();

await ba.clearDisplay();

clearOnExit(ba);

// const blockCharCodes: number[] = [176, 177, 178, 219, 220, 221, 222, 223, 254];

// [
//   176, 177, 178, 185, 186, 187, 188, 200, 201, 202, 203, 204, 205, 219, 220,
//   221, 222, 223, 254,
// ]

const blockCharCodes: number[] = [176, 177, 178, 219, 220, 221, 222, 223, 254];

await ba.setCursorPosition(0, 0);
await ba.render("Block chars: ");

await ba.render(blockCharCodes, { wrap: true });

await wait(5000);

await ba.clearDisplay();
