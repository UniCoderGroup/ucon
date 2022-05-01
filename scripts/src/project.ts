import fs from "fs";
import * as path from "path";
import { Command } from "commander";
import _ from "lodash";

export type PackageCommand =
  | string
  | string[]
  | {
      /**
       * @default "<CurrentPackage>"
       */
      workDir?: string;
      commands: string | string[];
    };
export interface PackageCommands {
  [name: string]: PackageCommand;
}
export interface PackageWorkflows {
  [name: string]: string[];
}
export interface PackageClass {
  name: string;
  commands?: PackageCommands;
  workflows?: PackageWorkflows;
}

export interface PackageInfo {
  name: string;
  path: string;
  class?: string;
  commands?: PackageCommands;
  workflows?: PackageWorkflows;
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
  packages: string[] | ["*"],
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
  if (packages[0] === "*") {
    for (let pkgName in info.packages) {
      let packageInfo = info.packages[pkgName];
      packageInfo = resolveClasses(packageInfo, info.classes);
      resolvePath(packageInfo, baseDir);
      addDefaultWorkflows(packageInfo);
      addName(packageInfo, pkgName);
      packageInfos.push(packageInfo);
    }
  } else {
    console.log(`
    ---
    packages: [${packages.join()}]
    ---
    `)
    packages.forEach((pkgName) => {
      let packageInfo = info.packages[pkgName];
      if (packageInfo) {
        packageInfo = resolveClasses(packageInfo, info.classes);
        resolvePath(packageInfo, baseDir);
        addDefaultWorkflows(packageInfo);
        addName(packageInfo, pkgName);
        packageInfos.push(packageInfo);
      } else {
        throw new Error(`No such package called ${pkgName}`);
      }
    });
  }
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

const defaultWorkflows = {
  build: ["build"],
  compile: ["compile"],
  start: ["compile", "start"],
  test: ["compile", "test"],
};

function addDefaultWorkflows(p: PackageInfo) {
  // p.workflows = _.defaults(p.workflows, defaultWorkflows);
}

function addName(p: PackageInfo, name: string) {
  p.name = _.defaultTo(p.name, name);
}
