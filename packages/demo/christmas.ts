import { BA63 } from "ba63";
import { clearOnExit, wait } from "./utils";

const ba = await BA63.create();

await ba.clearDisplay();

clearOnExit(ba);

class Snowflake {
  /** [row, col] */
  protected pos = [0, 0];

  constructor(pos: typeof this.pos) {
    this.pos = pos;
  }
}
