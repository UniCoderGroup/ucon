import { Argument, Command, Option } from "commander";
import * as P from "./project.js";
import { execSync } from "child_process";

export default (cmd: Command) => {
  cmd
    .command("run <type> <package...>")
    .description("Run a command in the specified package(s).")
    .option("-f, --file <path>", "File in the package to run")
    .action(
      (type: string, packages: string[], options: Option, command: Command) => {
        const [baseDir, packageInfos] = P.parseInfo(packages, command);
        packageInfos.forEach((pkg) => {
          console.log(`\u2139 INFO: start running in package "${pkg.name}".`);
          const runner = pkg.runners[type];
          if (!runner) {
            throw new Error(`Cannot find runner "${type}"`);
          }
          runner.forEach((command) =>
            runCommand(command, pkg.path, pkg.commands)
          );
        });
      }
    );
};

function runCommand(
  commandName: string,
  dir: string,
  commands: P.PackageCommands
) {
  const command = commands[commandName.trim()];
  if (command) {
    console.log(`▶ RUN: command "${commandName}" > ${command}`);
    // console.log();
    console.log("."+"-".repeat(5)+" OUTPUTS "+"-".repeat(6));
    try {
      execSync(command, {
        cwd: dir,
        stdio: "inherit",
      });
    } catch (e: any) {
      if (e instanceof Error) {
        console.log("Execute command error: " + e.message);
      }
    }
    console.log("`"+"-".repeat(20));
    // console.log();
    console.log(`✔ FINISHED: running command "${commandName}"`);
  } else {
    console.log(`⬇ SKIP: running command "${commandName}".`)
  }
}
