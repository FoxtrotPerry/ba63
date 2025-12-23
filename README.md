# BA63 📺

<p style="text-align: center;">
  <img src="./assets/demo.png" alt="Successfully running `BA63.testRender()`" width="320"/>
</p>

<p style="text-align: center;">
<code>ba63</code> is a very lightweight library that allows for simple interaction with any Wincor Nixdorf BA63 USB VFD.
</p>

## Installation

Bun:

```bash
bun add ba63
```

npm:

```bash
npm install ba63
```

Yarn:

```bash
yarn add ba63
```

## Getting started

Getting started with `ba63` is as easy as:

```typescript
import { BA63 } from "ba63";

const ba63 = await BA63.create();

await ba63.testRender();
```

Now we can enhance this script with the ability to clear the screen after a few seconds or on process interrupt:

```typescript
import { BA63 } from "ba63";

const ba63 = await BA63.create();

await ba63.testRender();

async function exit() {
  await ba63.clearDisplay();
  process.exit(0);
}

setTimeout(async () => {
  await exit();
}, 7000);

process.on("SIGINT", async () => {
  await exit();
});
```

Alternatively, you can pull down this repo and run the demo yourself:

```bash
bun install && bun demo
```
