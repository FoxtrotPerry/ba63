import { BA63 } from "ba63";
import { clearOnExit } from "./utils";
import { differenceInHours, intervalToDuration } from "date-fns";

const ba = await BA63.create();

const nextYear = new Date(new Date().getFullYear() + 1, 0, 1);

let prevTimeLeft = "";

await ba.setCursorPosition(0, 0);
await ba.fill([240]);
await ba.renderCenter(`=-${nextYear.getFullYear()} COUNTDOWN-=`);
await ba.setCursorPosition(1, 0);

async function renderTimeLeft() {
  const now = new Date();
  const duration = intervalToDuration({ start: now, end: nextYear });
  const hours = differenceInHours(nextYear, now);
  const timeLeft = `=-${hours}h ${duration.minutes ?? 0}m ${
    duration.seconds ?? 0
  }s-=`;
  if (prevTimeLeft.length !== timeLeft.length) {
    await ba.clearRow(1);
    await ba.setCursorPosition(1, 0);
    await ba.render(Array(20).fill(240));
  }
  await ba.setCursorPosition(1, 0);
  await ba.renderCenter(timeLeft);
  prevTimeLeft = timeLeft;
}

let newYearRendered = false;

async function renderHappyNewYear() {
  if (newYearRendered) return;
  await ba.fill([240]);
  await ba.setCursorPosition(0, 0);
  await ba.renderCenter("=-HAPPY NEW YEAR-=");
  newYearRendered = true;
}

const interval = setInterval(async () => {
  const isNewYear = new Date() >= nextYear;
  if (isNewYear) {
    await renderHappyNewYear();
  }
  await renderTimeLeft();
}, 1000);

clearOnExit(ba, () => {
  clearInterval(interval);
});
