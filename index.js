import { parse } from "https://deno.land/std@0.82.0/encoding/yaml.ts";

const loadConfig = async () => {
  try {
    return parse(await Deno.readTextFile("./config.yaml"));
  } catch {
    console.log();
    console.error("Error! No config.yaml file found!");
    console.log();
    Deno.exit(1);
  }
};

const config = await loadConfig() ?? {};
const args = Deno.args;
const executable = "dr";

const argExamples = config.argExamples ?? {};
const env = config.env ?? {};
const deps = config.dependencies ?? {};

const scriptOverview = (name, script) => {
  const alias = script.alias ?? name;
  const scriptArgs = script.args?.map((arg) => `_${arg}_`)?.join(" ") ?? "";

  if (alias !== name) {
    console.log(`- %c${name} / ${alias}`, "color: darkturquoise");
  } else console.log(`- %c${name}`, "color: darkturquoise");

  if (script.desc) {
    console.log("    %c" + script.desc, "color: lightblue");
  }

  if (scriptArgs) {
    const scriptExs = script.args?.map((arg) =>
      argExamples[arg] ?? arg
    )?.join(" ") ?? "";

    console.log(
      `      Usage:   %c${executable} ${alias} ${scriptArgs}`,
      "color: dodgerblue",
    );
    console.log(
      `      Example: %c${executable} ${alias} ${scriptExs}`,
      "color: red",
    );
  }
  console.log();
};

const allScriptsOverview = () => {
  console.log();

  if (!config.scripts) {
    console.log("%cThere is no available scripts", "color: red");
    console.log();
    Deno.exit(0);
  }

  console.log(`%c${config.name ?? ''} Available scripts:`, "color: green");
  console.log();
  Object.entries(config.scripts ?? {}).forEach(([key, script]) => {
    scriptOverview(key, script);
  });
  Deno.exit(0);
};

if (!args.length) allScriptsOverview();

const [scriptName, ...rest] = args;
const script = config.scripts?.[scriptName] ??
  Object.values(config.scripts ?? {}).find((info) =>
    info.alias === scriptName
  ) ??
  null;

if (!script) allScriptsOverview();

if (rest.length !== (script.args?.length ?? 0)) {
  console.log();
  console.log("%cCorrect usage:", "color: green");
  console.log();
  scriptOverview(scriptName, script);
  Deno.exit(0);
}

if (script.cmd) {
  const commands = Array.isArray(script.cmd) ? script.cmd : [script.cmd];

  for (let cmd of commands) {
    if (cmd.startsWith("dr ")) cmd = config.scripts[cmd.slice(3)]?.cmd;

    console.log();
    console.log(`%cLaunching ${cmd}`, "color: green");
    console.log();

    const process = Deno.run({
      cmd: cmd.split(" "),
      cwd: script.cwd ?? ".",
    });

    const { code } = await process.status();

    process.close();
    console.log();

    if (code) Deno.exit(code);
  }

  Deno.exit(0);
}

const getAllows = (script) => {
  const allows = script.allow ?? {};

  if (!allows.net) allows.net = [];
  if (!allows.read) allows.read = [];
  if (!allows.env) allows.env = [];

  allows.net.push("deno.land");
  allows.read.push("./src");
  allows.env.push("dr");

  return Object.entries(script.allow ?? {}).map(([key, list]) => {
    const updatedList = list.map((path) => {
      const newPath = script.args?.reduce(
        (accum, item) =>
          accum.replaceAll(
            `__${item}__`,
            rest[script.args?.findIndex((i) => i === item)] ?? "error",
          ),
        path,
      );
      return Object.keys(env).reduce(
        (accum, item) =>
          accum.replaceAll(
            `..${item}..`,
            env[item] ?? "error",
          ),
        newPath,
      );
    });
    return `--allow-${key}=${updatedList.join(",")}`;
  });
};

const getArgs = (script) =>
  script.args?.reduce((accum, arg, idx) => ({
    ...accum,
    [arg]: rest[idx],
  }), {});

const allows = getAllows(script) ?? [];
const scriptArgs = getArgs(script) ?? {};

console.log();
console.log(`%cLaunching ${script.exec}`, "color: green");
console.log();
const process = Deno.run({
  cmd: ["deno", "run", ...allows, script.exec],
  env: {
    dr: JSON.stringify({
      args: scriptArgs,
      env,
      dependencies: deps,
    }),
  },
});

const { code } = await process.status();
console.log();

process.close();

Deno.exit(code);
