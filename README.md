# DenoRunner
Deno runner similar to npm scripts and package.json

## Install and/or update

```
deno install -f --allow-run --allow-read=./config.yaml -n dr https://deno.land/x/denorunner/runner.js
```
⚠️ You need to add deno bin route to PATH (you can place this in ~/.bashrc or ~/.zshrc)
```
export PATH="~/snap/deno/80/.deno/bin:$PATH"
```

## Basic usage

- Create a config.yaml file with (name, description, version, env, dependencies or scripts) properties
- Put some scripts within it (you can see some script examples below)
- Run **dr** to see available scripts

```
dr 
```
- Import before all in your application scripts the following script
```js
import "https://deno.land/x/denorunner/cli.js"; 
```

## Script examples

### Non Deno run commands

```yaml
validate:
  desc: Validate codebase (check format & lint)
  cmd:
    - deno fmt --check
    - deno lint
```
You can now run:
```
dr validate
```

### Deno run commands

```yaml
more-complex:
  desc: More complex script
  alias: mcs
  exec: bin/js/more-complex-script.js
  args:
    - first_arg
  allow:
    net:
      - www.google.com
    read:
      - ./
```
Now you will execute the 'exec' file and it will have permissions to read current folder and to call to google.com.

You might pass an argument that will be available in code in *DenoRunner.args.first_arg*

You can now run:
```
dr more-complex 123
```
Or (thanks to the alias property):

```
dr mcs 123
```
And then:
```js
const { first_arg } = DenoRunner.args;

console.log(first_arg)
// logs 123
```

## Dependencies

You can specify your app dependencies in config.yaml under the property 'dependencies'. This allow you to avoid large URL imports within your codebase and version mismatching, and just import the dependencies from *DenoRunner.dependencies*

```yaml
dependencies:
  Yaml:
    import:
      parse: _
      stringify: _
    from: https://deno.land/std@0.82.0/encoding/yaml.ts
  Fs:
    import:
      ensure: ensureDir
      exists: _
    from: https://deno.land/std@0.82.0/fs/mod.ts
```

Now we can import the dependencies like that

```js
const { Yaml, Fs } = DenoRunner.dependencies;

const str = Yaml.stringify({ foo: 'bar' })

const dir = '~/tmp'
await Fs.ensure(dir)
```
Note that we have import 'ensureDir' from fs, but aliased to 'ensure'. The value '_' in the import fields means that it will mantain its property name.

## Env variables

You can pass constants to the application that will be available in *DenoRunner.env*
```yaml
env:
  data_path: ./resources/data
```

Now we can use it like that

```js
const { data_path } = DenoRunner.env;

const file = `${data_path}/dataframe.csv`
```
## Uninstall

```
deno uninstall dr
```
