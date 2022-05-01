import { Command, OptionValues } from "commander";
import * as P from "./project.js";
import { execSync } from "child_process";
import _ from "lodash";

function logOptOnly(isOptOnly: boolean, ...args: any[]) {
  if (!isOptOnly) return console.log(...args);
}

export default (cmd: Command) => {
  cmd
    .command("run <type> <package...>")
    .description("Run a command in the specified package(s).")
    // .option("-f, --file <path>", "File in the package to run")
    .option("-o, --opt-only", "Only print outputs of commands")
    .action(action);
};

function action(
  type: string,
  packages: string[] | ["*"],
  options: OptionValues,
  command: Command
) {
  console.log(packages);
  const [projectPath, packageInfos] = P.parseInfo(packages, command);
  const optOnly: boolean = options.optOnly;
  packageInfos.forEach((pkg) => {
    if (_.isUndefined(pkg.workflows)) {
      logOptOnly(optOnly, `⬇ SKIP: no workflows in package "${pkg.name}".`);
      return;
    }
    const workflow = pkg.workflows[type];
    if (_.isUndefined(workflow)) {
      logOptOnly(
        optOnly,
        `⬇ SKIP: no workflow "${type}" in package "${pkg.name}".`
      );
      return;
    }
    logOptOnly(
      optOnly,
      `\u2139 INFO: start running workflow "${type}" in package "${pkg.name}".`
    );
    logOptOnly(
      optOnly,
      `\u2139 INFO: workflow will run these commands: `,
      workflow,
      `.`
    );
    workflow.forEach((command) =>
      runCommand(
        command,
        _.defaultTo(pkg.commands, {}),
        pkg.path,
        projectPath,
        optOnly
      )
    );
  });
}

function runCommand(
  commandName: string,
  commands: P.PackageCommands,
  packagePath: string,
  projectPath: string,
  optOnly: boolean
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
      runAt = _.defaultTo(command.workDir, "<CurrentPackage>");
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

    logOptOnly(
      optOnly,
      `▶ RUN: command "${commandName}" (${cmds.length} subcommands) (run at: "${runAt}")`
    );

    for (let i in cmds) {
      const cmd = cmds[i];
      try {
        logOptOnly(
          optOnly,
          `▶ ${commandName} ▶ RUN: subcommand#${i + 1} > ${cmd}`
        );
        logOptOnly(optOnly, "." + "-".repeat(5) + " OUTPUTS " + "-".repeat(6));
        execSync(cmd, {
          cwd: runAt,
          stdio: "inherit",
        });
      } catch (e: any) {
        if (e instanceof Error) {
          logOptOnly(false, "Execute command error: " + e.message);
        }
      }
      logOptOnly(optOnly, "`" + "-".repeat(20));
    }
    logOptOnly(optOnly, `✔ FINISHED: running command "${commandName}"`);
  } else {
    logOptOnly(optOnly, `⬇ SKIP: no command "${commandName}".`);
  }
}
