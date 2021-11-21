import { ucon, ProgressBar } from "./index";
const p1 = new ProgressBar({ width: 20, name: "Processing1" });
const p2 = new ProgressBar({ width: 20, name: "Processing2" });
(async()=>{
await p1.mount();
await p2.mount();
})();
let n = 0;
const timer = setInterval(async () => {
  if (n > 5) return;
  await p1.progress(0.1);
  await p2.progress(0.05);
  await ucon.log(`Hi ${n}`);
  const p = new ProgressBar({ width: 20, name: "Processing#" + n });
  await p.mount();
  n++;
}, 300);