import HID from "node-hid";

const vendorId = 2727;
const productId = 512;

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
    return new BA63(device);
  }

  private async run(command: number[]): Promise<void> {
    // Pad to 32 bytes (HID report size)
    const writeComment = [0x02, 0x00, command.length, ...command];
    while (writeComment.length < 32) {
      writeComment.push(0x00);
    }

    await this.device.write(writeComment);
  }

  async render(message: string): Promise<void> {
    const trimmedMessage = message.slice(0, this.lengthToEnd);
    const data = Buffer.from(trimmedMessage, "ascii");
    const arr = Array.from(data);

    await this.run(arr);
  }

  async renderInCenter(message: string): Promise<void> {
    const trimmedMessage = message.slice(0, 20);
    const padding = Math.floor((20 - trimmedMessage.length) / 2);
    this.setCursorPosition(this.cursorPos[0], padding);

    await this.render(trimmedMessage);
  }

  async testRender(): Promise<void> {
    const testMessage = "Hello from BA63!";
    await this.renderInCenter(testMessage);
    await this.setCursorRow(1);
    await this.renderInCenter("- Caleb");
  }

  async setCharset(charset: number): Promise<void> {
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

  async setCursorRow(row: number): Promise<void> {
    this.setCursorPosition(row, this.cursorPos[1]);
  }

  async clearDisplay(): Promise<void> {
    const command = [0x1b, 0x5b, 0x32, 0x4a];
    await this.run(command);
  }

  get lengthToEnd(): number {
    return 20 - this.cursorPos[1];
  }
}
