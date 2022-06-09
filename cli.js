const env = JSON.parse(Deno.env.get("dr") ?? "{}");

globalThis.DenoRunner = {};

DenoRunner.args = env.args;
DenoRunner.env = env.env;

DenoRunner.dependencies = await Promise.all(
  Object.entries(env.dependencies).map(async ([key, dep]) => {
    const fullDep = await import(dep.from);

    return {
      [key]: Object.entries(dep.import).reduce((accum, [alias, depKey]) => ({
        ...accum,
        [alias]: depKey === "_" ? fullDep[alias] : fullDep[depKey],
      }), {}),
    };
  }),
).then((data) => Object.assign({}, ...data));
