import { Command } from "commander";
import fs from "fs";
import { execSync } from "child_process";
import * as path from "path";
const info = getInfo();
process.stdout;
const program = new Command();

program.option("-i, --info <file>", "Specific project info file.");

program
  .command("run <package>")
  .description("Run a package")
  .option("-f, --file <path>", "File in the package to run")
  .action((pkgName: string, options, command) => {
    const pkg = info.packages.find((v) => v.name === pkgName);
    if (pkg === undefined)
      throw new Error('Unknown package name :"' + pkgName + '"!');
    console.log("Package info (classses filled in): ");
    console.log(" - Path:\t" + pkg.path);
    const dir = path.resolve("../", pkg.path);
    console.log(" - Run at:\t" + dir);
    console.log('Running package "' + pkgName + '" ...');
  });

program.parse(process.argv);
resolveClasses(info);

// let execIn = fs.createReadStream(""),
// execOut = new WriteStream(1),
// execErr = new WriteStream(2);
// execOut.on("data",data=>{
//   console.log("????????",data.toString());
// });
// execErr.on("data",data=>{
//   console.error("????????",data.toString());
// });

if (pkg.compile) {
  console.log(" - Compile cmd:\t" + pkg.compile);
  try {
    execSync(pkg.compile, {
      cwd: dir,
      stdio: "inherit",
    });
  } catch (e: any) {
    if (e instanceof Error) {
      console.log("Compile error: " + e.message);
    }
  }
  console.log("Compiled.");
}
if (pkg.run) {
  console.log(" - Run cmd:\t" + pkg.run);
  try {
    execSync(pkg.run, {
      cwd: dir,
      stdio: "inherit",
    });
  } catch (e: any) {
    if (e instanceof Error) {
      console.log("Run error: " + e.message);
    }
  }
}

interface PackageInfo {
  class?: string;
  compile?: string;
  run?: string;
}
interface Info {
  classes: ({
    name: string;
  } & PackageInfo)[];
  packages: ({
    name: string;
    path: string;
  } & PackageInfo)[];
}
function getInfo(): Info {
  return JSON.parse(fs.readFileSync("../project.info.json").toString());
}
function resolveClasses(info: Info) {
  let classes: {
    [key: string]: typeof info.classes[any];
  } = {};
  for (let c of info.classes) {
    classes[c.name] = c;
  }
  for (let p of info.packages) {
    if (p.class) {
      p.class.split(" ").forEach((v) => {
        const c = classes[v];
        for (let k in c) {
          if (!(k in p)) {
            p[k as keyof PackageInfo] = c[k as keyof PackageInfo];
          }
        }
      });
    }
  }
}
