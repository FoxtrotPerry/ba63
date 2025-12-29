import { BA63 } from "ba63";
import { clamp, clearOnExit } from "./utils";

const ba = await BA63.create();

await ba.clearDisplay();

async function renderMerryChristmas() {
  await ba.setCursorPosition(0, 0);
  const r1CellsUsed = await ba.renderCenter("Merry Christmas!");
  await ba.setCursorPosition(1, 0);
  const r2CellsUsed = await ba.renderCenter("2025");
  return { row1: r1CellsUsed, row2: r2CellsUsed };
}

class Snowflake {
  /** [row, col] */
  protected _pos: [number, number] = [0, 0];

  protected _symbolIndex = 0;

  private ba: BA63 = ba;

  /**
   * Sequence of symbols to use for the snowflake animation:
   * 1. 32 = (space)
   * 2. 250 = ·
   * 3. 246 = ÷
   * 4. 43 = +
   * 5. 42 = *
   */
  static symbols = [32, 250, 246, 43, 42] as const;

  constructor(ba: BA63, pos: typeof this._pos, symbolIndex = 0) {
    this.ba = ba;
    this._pos = pos;
    this._symbolIndex = clamp(symbolIndex, 0, Snowflake.symbols.length - 1);
  }

  async render(): Promise<void> {
    await this.ba.setCursorPosition(this._pos[0], this._pos[1]);
    await this.ba.render([this.currSymbol]);
  }

  /** tell snowflake to switch to the next symbol */
  nextSymbol(): void {
    // 1 in 25 chance to skip the next symbol to break up patterns
    const roll = Math.floor(Math.random() * 25);
    const modifier = roll === 16 ? 2 : 1;
    this._symbolIndex =
      (this._symbolIndex + modifier) % Snowflake.symbols.length;
  }

  get currSymbol(): number {
    return Snowflake.symbols[this._symbolIndex] ?? Snowflake.symbols[0];
  }

  get pos(): typeof this._pos {
    return this._pos;
  }

  get symbolIndex(): number {
    return this._symbolIndex;
  }
}

const usedCells = await renderMerryChristmas();

const snowflakes: Snowflake[] = [];

let r1Done = false;
let r2Done = false;
for (let i = 1; !r1Done || !r2Done; i++) {
  // generate snowflakes around the rendered text

  const modifier = i * 2;

  // row 1
  if (!r1Done) {
    const startIdx = usedCells.row1.start - modifier;
    const endIdx = usedCells.row1.end + modifier;
    if (startIdx >= 0 && endIdx <= 19) {
      snowflakes.push(
        new Snowflake(
          ba,
          [0, startIdx],
          Math.floor(Math.random() * Snowflake.symbols.length)
        )
      );
      snowflakes.push(
        new Snowflake(
          ba,
          [0, endIdx],
          Math.floor(Math.random() * Snowflake.symbols.length)
        )
      );
    } else {
      r1Done = true;
    }
  }

  // row 2
  if (!r2Done) {
    const startIdx = usedCells.row2.start - modifier;
    const endIdx = usedCells.row2.end + modifier;
    if (startIdx >= 0 && endIdx <= 19) {
      snowflakes.push(
        new Snowflake(
          ba,
          [1, startIdx],
          Math.floor(Math.random() * Snowflake.symbols.length)
        )
      );
      snowflakes.push(
        new Snowflake(
          ba,
          [1, endIdx],
          Math.floor(Math.random() * Snowflake.symbols.length)
        )
      );
    } else {
      r2Done = true;
    }
  }
}

const renderInterval = setInterval(async () => {
  for (const s of snowflakes) {
    await s.nextSymbol();
    await s.render();
  }
}, 300);

clearOnExit(ba, () => {
  clearInterval(renderInterval);
});
