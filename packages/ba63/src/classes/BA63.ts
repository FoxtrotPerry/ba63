import HID from "node-hid";
import type { Charset } from "../constants/charset";
import { blocks } from "../constants/blocks";

const vendorId = 2727;
const productId = 512;

type RenderOptions = Partial<{
  /** If the message reaches the end of the top line, start printing on the bottom line.*/
  wrap: boolean;
}>;

/** The start and end column positions of the section of cells used */
type UsedCells = {
  /** The start position of the section of cells used */
  start: number;
  /** The end position of the section of cells used */
  end: number;
};

export class BA63 {
  private device: HID.HIDAsync;

  /** Current cursor position in [row, column] format */
  protected cursorPos: [number, number] = [0, 0];

  /**
   * **NOTE**: This constructor should only be used if you already have an open HID device to interface with.
   */
  constructor(device: HID.HIDAsync) {
    this.device = device;
  }

  static async create(): Promise<BA63> {
    const devices = HID.devices();
    const ba63Devices = devices.filter(
      (device) => device.vendorId === vendorId && device.productId === productId
    );

    if (ba63Devices.length === 0) {
      throw new Error("BA63 device not found");
    }

    /*
     * When connecting to a BA63, you'll find that there are two different interfaces
     * to connect to. Interface 0 is for updating the BA63's firmware whereas interface 1
     * is for communicating with the display itself.
     */
    const displayInterface = ba63Devices.find((d) => d.interface === 1);

    if (!displayInterface) {
      throw new Error("BA63 display interface (Interface 1) not found!");
    }

    const device = await HID.HIDAsync.open(displayInterface.path!);

    // device.on("data", (data) => {
    //   console.log("Data received:", data);
    // });

    // device.on("error", (err) => {
    //   console.error("Error:", err);
    // });

    const ba63 = new BA63(device);
    await ba63.clearDisplay();
    await ba63.setCharset(0); // Set to USA charset

    return ba63;
  }

  private async run(command: number[]): Promise<void> {
    // Pad to 32 bytes (HID report size)
    const writeCommand = [0x02, 0x00, command.length, ...command];
    while (writeCommand.length < 32) {
      writeCommand.push(0x00);
    }

    await this.device.write(writeCommand);
  }

  async render(
    message: string | number[],
    options?: RenderOptions
  ): Promise<void> {
    const trimmedMessage = message.slice(0, this.lengthToEnd);

    const arr =
      typeof trimmedMessage === "string"
        ? Array.from(Buffer.from(trimmedMessage, "ascii"))
        : trimmedMessage;

    await this.run(arr);
    this.setCursorColumn(this.currentColumn + arr.length);

    // If wrapping is enabled, we're on the top line, and there's more message to render, continue rendering on next line
    if (
      options?.wrap &&
      this.row === "top" &&
      message.length > trimmedMessage.length
    ) {
      const excessMessage = message.slice(trimmedMessage.length);

      await this.setCursorPosition(1, 0);

      const excessArr =
        typeof excessMessage === "string"
          ? Array.from(Buffer.from(excessMessage, "ascii"))
          : excessMessage;

      await this.run(excessArr);
      this.setCursorColumn(this.currentColumn + excessArr.length);
      return;
    }
  }

  async renderCenter(message: string): Promise<UsedCells> {
    const trimmedMessage = message.slice(0, 20);
    const padding = Math.floor((20 - trimmedMessage.length) / 2);
    this.setCursorPosition(this.cursorPos[0], padding);

    await this.render(trimmedMessage);
    const columnCellsUsed = {
      start: padding,
      end: padding + trimmedMessage.length - 1,
    };
    return columnCellsUsed;
  }

  async renderLeft(message: string): Promise<UsedCells> {
    const trimmedMessage = message.slice(0, 20);
    this.setCursorPosition(this.cursorPos[0], 0);

    await this.render(trimmedMessage);
    const columnCellsUsed = {
      start: 0,
      end: trimmedMessage.length - 1,
    };
    return columnCellsUsed;
  }

  async renderRight(message: string): Promise<UsedCells> {
    const trimmedMessage = message.slice(0, 20);
    const startPos = 20 - trimmedMessage.length;
    this.setCursorPosition(this.cursorPos[0], startPos);

    await this.render(trimmedMessage);
    const columnCellsUsed = {
      start: startPos,
      end: 19,
    };
    return columnCellsUsed;
  }

  async fill(charCode: number): Promise<void> {
    const savedPos = this.cursorPos;
    const command = Array(40).fill(charCode);
    await this.setCursorPosition(0, 0);
    await this.render(command, { wrap: true });
    this.setCursorPosition(...savedPos);
  }

  async testRender(): Promise<void> {
    const testMessage = "Hello from BA63!";
    await this.fill(blocks.LIGHT_SHADE);
    await this.renderCenter(testMessage);
    await this.setCursorRow(1);
    await this.renderCenter("- Caleb");
  }

  async carriageReturn(): Promise<void> {
    const command = [0x0d];
    await this.run(command);
    this.setCursorColumn(0);
  }

  async lineFeed(): Promise<void> {
    const command = [0x0a];
    await this.run(command);
    this.setCursorRow(1);
  }

  async backspace(): Promise<void> {
    const command = [0x08];
    await this.run(command);
    this.setCursorColumn(Math.max(0, this.currentColumn - 1));
  }

  async setCharset(charset: Charset): Promise<void> {
    const command = [0x1b, 0x52, charset];
    await this.run(command);
  }

  async deleteToEOL(): Promise<void> {
    const command = [0x1b, 0x5b, 0x30, 0x4b];
    await this.run(command);
  }

  async setCursorPosition(row: number, column: number): Promise<void> {
    this.cursorPos = [row, column];

    const asciiRow = (row + 1).toString().charCodeAt(0);
    // asciiColumn can be more than one digit
    const asciiColumn = (column + 1)
      .toString()
      .split("")
      .map((char) => char.charCodeAt(0));

    const command = [0x1b, 0x5b, asciiRow, 0x3b, ...asciiColumn, 0x48];
    await this.run(command);
  }

  async setCursorColumn(column: number): Promise<void> {
    this.setCursorPosition(this.cursorPos[0], column);
  }

  async setCursorRow(row: (typeof this.cursorPos)[0]): Promise<void> {
    this.setCursorPosition(row, this.cursorPos[1]);
  }

  async clearDisplay(): Promise<void> {
    const command = [0x1b, 0x5b, 0x32, 0x4a];
    await this.run(command);
  }

  get lengthToEnd(): number {
    return 20 - this.cursorPos[1];
  }

  get row(): "top" | "bottom" {
    return this.cursorPos[0] === 0 ? "top" : "bottom";
  }

  get currentRow(): number {
    return this.cursorPos[0];
  }

  get currentColumn(): number {
    return this.cursorPos[1];
  }
}
