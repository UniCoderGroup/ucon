import { Command } from "commander";
import setupCmdRun from "./run.js";
const program = new Command();

program
  .name("monocli")
  .version("0.0.0")
  .option(
    "-p, --project <project-info-file-path>",
    "Specific project info file."
  );

setupCmdRun(program);

program.parse(process.argv);
