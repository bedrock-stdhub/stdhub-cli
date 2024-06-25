import { confirm, input } from '@inquirer/prompts';
import { randomUUID } from 'crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import createBoilerplate from './boilerplate.js';

export const versionRegex = /^\d+\.\d+\.\d+$/;
export const latestApiRelease = '1.11.0'; // latest till 2024/6/23
export const versionMapping = new Map<string, string>([
  [ '1.0.0', '1.19.70' ],
  [ '1.1.0', '1.19.80' ],
  [ '1.2.0', '1.20.0'  ],
  [ '1.3.0', '1.20.10' ],
  [ '1.4.0', '1.20.20' ],
  [ '1.5.0', '1.20.30' ],
  [ '1.6.0', '1.20.40' ],
  [ '1.7.0', '1.20.50' ],
  [ '1.8.0', '1.20.60' ],
  [ '1.9.0', '1.20.70' ],
  [ '1.10.0', '1.20.80' ],
  [ '1.11.0', '1.21.0' ],
]);

export default async function init() {
  const behaviorPackUUID = randomUUID();
  const scriptResourceUUID = randomUUID();
  const resourcePackUUID = randomUUID();
  const resourceModuleUUID = randomUUID();

  /* The package.json provided by Microsoft in ts-starter:
    {
      "name": "scripting-starter",
      "version": "0.1.0",
      "productName": "Minecraft TypeScript Starter Project",
      "description": "Minecraft TypeScript Starter Project",
      "private": true,
      "devDependencies": {
        "@minecraft/core-build-tasks": "^1.1.3",
        "eslint-plugin-minecraft-linting": "^1.2.1",
        "source-map": "^0.7.4",
        "ts-node": "^10.9.1",
        "typescript": "^5.0.2"
      },
      "scripts": {
        "lint": "just-scripts lint",
        "build": "just-scripts build",
        "clean": "just-scripts clean",
        "local-deploy": "just-scripts local-deploy",
        "mcaddon": "just-scripts mcaddon",
        "enablemcloopback": "CheckNetIsolation.exe LoopbackExempt -a -p=S-1-15-2-1958404141-86561845-1752920682-3514627264-368642714-62675701-733520436",
        "enablemcpreviewloopback": "CheckNetIsolation.exe LoopbackExempt -a -p=S-1-15-2-424268864-5579737-879501358-346833251-474568803-887069379-4040235476"
      },
      "dependencies": {
        "@minecraft/math": "^1.1.0",
        "@minecraft/server": "^1.8.0",
        "@minecraft/server-ui": "^1.1.0",
        "@minecraft/vanilla-data": "^1.20.60"
      }
    }
  */
  console.log('Resolving `package.json`...');
  const packageJson = JSON.parse(fs.readFileSync('package.json').toString());

  const pluginName = await input({
    message: 'The name of plugin:',
  });
  const pluginDescription = await input({
    message: 'The description of plugin:',
  });
  const pluginVersion = await input({
    message: 'The version of plugin:',
    default: '0.1.0',
    validate: input => versionRegex.test(input),
  });
  const targetApiVersion = await input({
    message: 'Version of @minecraft/server:',
    default: latestApiRelease,
    validate: input => versionRegex.test(input) && (typeof versionMapping.get(input) === 'string'),
  });
  const minEngineVersion = versionMapping.get(targetApiVersion)!;

  console.log({ pluginName, pluginDescription, pluginVersion, targetApiVersion });
  const ok = await confirm({
    message: 'Is that OK?',
  });
  if (!ok) {
    console.log('Info not confirmed. Please execute `npx stdhub-cli init` again.');
    return;
  }

  packageJson.name = pluginName;
  packageJson.productName = pluginName;
  packageJson.description = pluginDescription;
  packageJson.version = pluginVersion;
  packageJson.dependencies['@minecraft/server'] = `^${targetApiVersion}`;
  packageJson.dependencies['@minecraft/vanilla-data'] = `^${versionMapping.get(targetApiVersion)}`;
  fs.writeFileSync(
    'package.json',
    JSON.stringify(packageJson, null, 2)
  );
  console.log('Successfully patched `package.json`.');

  fs.writeFileSync(
    '.env',
    fs.readFileSync('.env').toString()
    .split('\n')
    .map(line => line.startsWith('PROJECT_NAME=') ? `PROJECT_NAME="${pluginName}"` : line)
    .join('\n')
  );
  console.log('Successfully patched `.env`.');

  const pluginVersionArray = pluginVersion.split('.').map(v => parseInt(v));
  const minEngineVersionArray = minEngineVersion.split('.').map(v => parseInt(v));

  const { bp_manifest, rp_manifest } = createBoilerplate(
    pluginName,
    pluginDescription,
    pluginVersionArray,
    targetApiVersion,
    minEngineVersionArray,
    behaviorPackUUID,
    scriptResourceUUID,
    resourcePackUUID,
    resourceModuleUUID
  );

  fs.mkdirSync('behavior_packs');
  fs.mkdirSync(path.resolve('behavior_packs', pluginName));
  fs.writeFileSync(
    path.resolve('behavior_packs', pluginName, 'manifest.json'),
    JSON.stringify(bp_manifest, null, 2)
  );
  fs.mkdirSync('resource_packs');
  fs.mkdirSync(path.resolve('resource_packs', pluginName));
  fs.writeFileSync(
    path.resolve('resource_packs', pluginName, 'manifest.json'),
    JSON.stringify(rp_manifest, null, 2)
  );
  console.log('Successfully created `manifest.json`s.');

  const entryFilePath = path.resolve('src', 'main.ts');
  const entryFileLines = fs.readFileSync(entryFilePath).toString().split('\n');
  const indexOfLineToPatch = entryFileLines.findIndex(
    line => line.startsWith('export const pluginName')
  );
  entryFileLines[indexOfLineToPatch] = `export const pluginName = '${pluginName}';'`;
  fs.writeFileSync(entryFilePath, entryFileLines.join('\n'));
  console.log('Successfully patched `main.ts`.');

  console.log();
  console.log('Initialization complete.');
  console.log('Remember to execute \x1b[44;37mnpm update @minecraft/server-net\x1b[0m to check for package updates.');
  console.log('Execute `\x1b[32mnpm install\x1b[0m` (or other package managers) and enjoy your journey!');
}