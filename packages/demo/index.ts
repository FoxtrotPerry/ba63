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
