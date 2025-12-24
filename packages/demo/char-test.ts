import { BA63 } from "ba63";
import { clearOnExit, wait } from "./utils";

const ba = await BA63.create();

await ba.clearDisplay();

clearOnExit(ba);

for (let i = 32; i < 255; i++) {
  await ba.setCursorPosition(0, 0);
  await ba.render("Code: ");
  await ba.render(i.toString());
  await ba.setCursorPosition(1, 0);
  await ba.render("Char:  ");
  await ba.backspace();
  await ba.render([i]);
  await wait(75);
}
