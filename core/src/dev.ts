import chalk from "chalk";
import ucon, {
  chalkjs,
  GroupBox,
  ProgressBar,
  Switcher,
  symbolIcon,
  Text,
} from "./index";

let timeBegin = process.uptime();
let group = new GroupBox({});
group.begin("Process Request ", chalkjs(chalk.blueBright, "#3"));
group.sect("Parse");
group.log("METHOD: ", chalkjs(chalk.green, "GET"));
group.log(
  'PATH:   "',
  chalkjs(chalk.yellow, "/packages/a-big-package.html"),
  '"'
);
group.sect("Response");
let n = 10;
const fn = (id: number) => {
  let name = "Package " + chalkjs(chalk.yellow, id.toString()).render();
  let progress = new Switcher({
    ctor1: ProgressBar,
    prop1: {
      name: name + ": Uploading",
      width: 30,
      fractionDigits: 1,
    },
    ctor2: Text,
    prop2: [name, ": ", symbolIcon("tick"), " Uploaded."],
  });
  progress.mount(1);
  const timer = setInterval(() => {
    if (progress.comp1!.progress(0.1) >= 1) {
      clearInterval(timer);
      progress.switch(2);
      finisher();
    }
  }, Math.random() * 50);
};
let finished = 0;
const finisher = () => {
  finished++;
  if (finished >= n) {
    ucon.deleteLine(waitText);
    group.step(
      "Responsed in ",
      chalkjs(
        chalk.yellow,
        `${((process.uptime() - timeBegin) * 1000).toFixed(0)}ms`
      )
    );
    group.end();
    //id.end();
  }
};
for (let i = 0; i < n; i++) {
  fn(i);
}
let waitText = ucon.log(chalkjs(chalk.green, "...waiting..."));

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

// class A<T> {
//   a: T | undefined;
// }
// class B<T> extends A<number>{
//   b:T|undefined;
// }
// type TypeOfA<T extends A<unknown>>  = T extends A<infer TA>?TA|undefined:never;

// class C<T extends A<number>> {
//   fn(x: TypeOfA<T>) {
//     if (x !== undefined) {
//       let a = x+1;
//     }
//   }
// }
// const c = new C<B>();

// type FF = (x:TypeOfA<B<boolean>>)=>void;


// let t = (a:number|undefined)=>{};

// function tf(f:FF){
//   f(1);
// }

// tf(t);

// let x:FF = t;

// x(1);