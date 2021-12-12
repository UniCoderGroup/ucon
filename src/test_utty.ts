import Utty from "./utty";

let tty = new Utty(process.stdout);
tty.output("0");
tty.output("1");
tty.output("2");
tty.output("3");
tty.output("4");
tty.output("5");
tty.output("6");
tty.output("7");
tty.output("8");
tty.output("9");
tty.redraw(1, "1+");
tty.clearLine(0, 2);
tty.output("??s");
tty.output("??s");