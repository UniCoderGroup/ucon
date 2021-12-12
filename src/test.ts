import chalk from "chalk";
import { ucon, ProgressBar, Table, GroupBox, chalkjs, combiner, symbolIcon, Switcher, ProgressBarProps, Text, TextProp } from "./index";

let group = new GroupBox({});

group.begin("Process Request ", chalkjs(chalk.blueBright, "#3"));
group.sect("Parse>");
group.log("METHOD: ", chalkjs(chalk.green, "GET"));
group.log("PATH:   \"", chalkjs(chalk.yellow, "/home/index.html"), "\"");
group.sect("Response>");
let writeProgress = new Switcher<ProgressBar, ProgressBarProps, Text, TextProp>({
  ctor1: ProgressBar,
  prop1: {
    name: "Write Response",
    width: 30,
    fractionDigits: 1
  },
  ctor2: Text,
  prop2: symbolIcon("tick").render() + "Response writing completed."
});
writeProgress.mount(1);
group.log("xxx");
const timer = setInterval(() => {
  if (writeProgress.comp1!.progress(0.1) >= 1) {
    clearInterval(timer);
    writeProgress.switch(2);
    group.step("Responsed in ", chalkjs(chalk.yellow, "3ms"));
    group.end();
  }
}, 100);

// interface Process{
//   Id:number,
//   ProcessName:string
// };
// let table = new Table<Process>({
//   title:"Process",
//   separator:true,
//   cols:[
//     {
//       title:"PID",
//       width: 10,
//       align: "middle",
//       key:"Id"
//     },
//     {
//       title:"Name",
//       width: 50,
//       align: "left",
//       key:"ProcessName"
//     }
//   ]
// });
// table.datas=[
//   {
//     Id:19728,
//     ProcessName:"ApplicationFrameHost"
//   },
//   {
//     Id:21172,
//     ProcessName:"audiodg"    
//   }
// ]
// table.mount();

// const p1 = new ProgressBar({ width: 20, name: "Processing1",fractionDigits:3 });
// const p2 = new ProgressBar({ width: 20, name: "Processing2",fractionDigits:3 });
// (async()=>{
// p1.mount();
// p2.mount();
// })();
// ucon.log("1","2","3");
// ucon.log("1","2","3");
// ucon.log("1","2","3");
// ucon.log("1","2","3");
// let n = 0;
// const timer = setInterval(async () => {
//   if (n > 19) return;
//   p1.progress(0.1);
//   p2.progress(0.05);
//   n++;
// }, 1000);

// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// stdout.write("1\n");
// ucon.moveY(-100);
// stdout.re