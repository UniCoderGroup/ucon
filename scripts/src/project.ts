import fs from "fs";
import * as path from "path";
import { Command } from "commander";
import _ from "lodash";

export interface PackageCommands {
  [name: string]: string;
}
export interface PackageRunners {
  [name: string]: string[];
}
export interface PackageClass {
  name: string;
  commands: PackageCommands;
  runners: PackageRunners;
}

export interface PackageInfo {
  name?: string;
  path: string;
  class?: string;
  commands: PackageCommands;
  runners: PackageRunners;
}

interface ProjectInfo {
  classes: { [name: string]: PackageClass };
  packages: { [name: string]: PackageInfo };
}
export function lookUpBaseDir(current: string): string {
  const parent = path.join(current, "..");
  if (parent === current) throw new Error("Cannot find base dir!");
  return fs.existsSync(path.join(parent, "project.info.json"))
    ? parent
    : lookUpBaseDir(parent);
}

export function readInfo(infoPath: string): ProjectInfo {
  return JSON.parse(fs.readFileSync(infoPath).toString());
}

export function parseInfo(
  packages: string[],
  command: Command
): [baseDir: string, packageInfos: PackageInfo[]] {
  let project = command.parent?.opts().project;
  if (project) {
    if (fs.lstatSync(project).isDirectory()) {
      path.join(project, "project.info.json");
    }
    if (fs.existsSync(project)) {
      throw new Error(`Project info file not found at "${project}"`);
    }
  } else {
    project = path.join(lookUpBaseDir(process.cwd()), "project.info.json");
  }
  let baseDir = path.join(project, "..");
  console.log(`\u2139 INFO: project base directory: ${baseDir}`);
  console.log(`\u2139 INFO: project info file: ${project}`);
  let info = readInfo(project);
  let packageInfos: PackageInfo[] = [];
  packages.forEach((pkgName) => {
    let packageInfo = info.packages[pkgName];
    if (packageInfo) {
      packageInfo = resolveClasses(packageInfo, info.classes);
      resolvePath(packageInfo, baseDir);
      addDefaultRunners(packageInfo);
      addName(packageInfo, pkgName);
      packageInfos.push(packageInfo);
    } else {
      console.log(info);
      throw new Error(`No such package called ${pkgName}`);
    }
  });
  return [baseDir, packageInfos];
}

function resolveClasses(
  p: PackageInfo,
  c: { [name: string]: PackageClass }
): PackageInfo {
  if (p.class) {
    p = _.defaultsDeep(p, ...p.class.split(" ").map((v) => c[v.trim()]));
  }
  return p;
}

function resolvePath(p: PackageInfo, baseDir: string) {
  if (!path.isAbsolute(p.path)) {
    p.path = path.join(baseDir, p.path);
  }
}

const defaultRunners = {
  build: ["build"],
  compile: ["compile"],
  start: ["compile", "start"],
  test: ["compile", "test"],
};

function addDefaultRunners(p: PackageInfo) {
  p.runners = _.defaults(p.runners, defaultRunners);
}

function addName(p: PackageInfo, name: string) {
  p.name = p.name ?? name;
}

// const pkg = info.packages.find((v) => v.name === pkgName);
// if (pkg === undefined)
//   throw new Error('Unknown package name :"' + pkgName + '"!');
// console.log("Package info (classses filled in): ");
// console.log(" - Path:\t" + pkg.path);
// const dir = path.resolve("../", pkg.path);
// console.log(" - Run at:\t" + dir);
// console.log('Running package "' + pkgName + '" ...');

// program.parse(process.argv);
// resolveClasses(info);

// let execIn = fs.createReadStream(""),
//   execOut = new WriteStream(1),
//   execErr = new WriteStream(2);
// execOut.on("data", (data) => {
//   console.log("????????", data.toString());
// });
// execErr.on("data", (data) => {
//   console.error("????????", data.toString());
// });

// if (pkg.compile) {
//   console.log(" - Compile cmd:\t" + pkg.compile);
//   try {
//     execSync(pkg.compile, {
//       cwd: dir,
//       stdio: "inherit",
//     });
//   } catch (e: any) {
//     if (e instanceof Error) {
//       console.log("Compile error: " + e.message);
//     }
//   }
//   console.log("Compiled.");
// }
// if (pkg.run) {
//   console.log(" - Run cmd:\t" + pkg.run);
//   try {
//     execSync(pkg.run, {
//       cwd: dir,
//       stdio: "inherit",
//     });
//   } catch (e: any) {
//     if (e instanceof Error) {
//       console.log("Run error: " + e.message);
//     }
//   }
// }

// interface PackageInfo {
//   class?: string;
//   compile?: string;
//   run?: string;
// }
// interface Info {
//   classes: ({
//     name: string;
//   } & PackageInfo)[];
//   packages: ({
//     name: string;
//     path: string;
//   } & PackageInfo)[];
// }
