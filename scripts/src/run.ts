import { Argument, Command, Option } from "commander";
import * as P from "./project.js";
import { execSync } from "child_process";
import _ from "lodash";

export default (cmd: Command) => {
  cmd
    .command("run <type> <package...>")
    .description("Run a command in the specified package(s).")
    .option("-f, --file <path>", "File in the package to run")
    .action(
      (type: string, packages: string[], options: Option, command: Command) => {
        const [projectPath, packageInfos] = P.parseInfo(packages, command);
        packageInfos.forEach((pkg) => {
          const runner = pkg.runners[type];
          if (!runner) {
            throw new Error(`Cannot find runner "${type}"`);
          }
          console.log(
            `\u2139 INFO: start running "${type}" in package "${pkg.name}".`
          );
          console.log(
            `\u2139 INFO: runner will run these commands: `,
            runner,
            `.`
          );
          runner.forEach((command) =>
            runCommand(command, pkg.commands, pkg.path, projectPath)
          );
        });
      }
    );
};

function runCommand(
  commandName: string,
  commands: P.PackageCommands,
  packagePath: string,
  projectPath: string
) {
  let command = commands[commandName.trim()];
  if (command) {
    let cmds: string[],
      runAt = "<CurrentPackage>";
    if (_.isString(command)) {
      cmds = [command];
    } else if (_.isArray(command)) {
      cmds = command;
    } else if (_.isObject(command)) {
      runAt = command.runAt ?? "<CurrentPackage>";
      if (_.isString(command.commands)) {
        cmds = [command.commands];
      } else {
        cmds = command.commands;
      }
    }

    const replaceTable: { [name: string]: string } = {
      "<CurrentProject>": projectPath,
      "<CurrentPackage>": packagePath,
    };
    const replacer = (v: string) => {
      for (let k in replaceTable) {
        v = v.replace(new RegExp(_.escapeRegExp(k), "g"), replaceTable[k]);
      }
      return v;
    };

    cmds = cmds!.map(replacer);
    runAt = replacer(runAt);

    console.log(
      `▶ RUN: command "${commandName}" (${cmds.length} subcommands) (run at: "${runAt}")`
    );

    for (let i in cmds) {
      const cmd = cmds[i];
      try {
        console.log(`▶▶ RUN: subcommand#${i + 1} > ${cmd}`);
        console.log("." + "-".repeat(5) + " OUTPUTS " + "-".repeat(6));
        execSync(cmd, {
          cwd: runAt,
          stdio: "inherit",
        });
      } catch (e: any) {
        if (e instanceof Error) {
          console.log("Execute command error: " + e.message);
        }
      }
    }
    console.log("`" + "-".repeat(20));
    console.log(`✔ FINISHED: running command "${commandName}"`);
  } else {
    console.log(`⬇ SKIP: running command "${commandName}".`);
  }
}
