import { confirm, input, select } from '@inquirer/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { stdhubApiVersions, versionRegex, versions } from './index.js';

export default async function patch() {
  console.log('Reading plugin name and version from `package.json`...');
  const packageJson = JSON.parse(fs.readFileSync('package.json').toString());
  const bpManifestLocation = path.resolve('behavior_packs', packageJson.name, 'manifest.json');
  const rpManifestLocation = path.resolve('resource_packs', packageJson.name, 'manifest.json');
  const bpManifest = JSON.parse(fs.readFileSync(bpManifestLocation).toString());
  const rpManifest = JSON.parse(fs.readFileSync(rpManifestLocation).toString());

  const newVersion = await input({
    message: 'New version:',
    default: packageJson.version,
    validate: input => versionRegex.test(input),
  });
  const newTargetApiVersion = await select({
    message: 'Target API version:',
    choices: versions.map(value => ({
      value,
      name: value.original,
      description: `compatible with Minecraft ${value.releaseVersion}`,
    })),
    default: versions[0],
  });
  const newStdhubApiVersion = await select({
    message: 'stdhub-plugin-api version:',
    choices: stdhubApiVersions.map(value => ({ value })),
    default: stdhubApiVersions[0],
  });
  const newDescription = await input({
    message: 'New description:',
    default: packageJson.description,
  });
  const newVersionArray = newVersion.split('.').map(v => parseInt(v));
  const newMinEngineVersionArray = newTargetApiVersion.releaseVersion.split('.').map(v => parseInt(v));

  console.log({ newVersion, newTargetApiVersion, newStdhubApiVersion, newDescription });
  const ok = await confirm({
    message: 'Is that OK?',
  });
  if (!ok) {
    console.log('Info not confirmed. Please execute `npx stdhub-cli patch` again.');
    return;
  }

  packageJson.version = newVersion;
  packageJson.description = newDescription;
  packageJson.dependencies['@minecraft/server'] = newTargetApiVersion.original;
  packageJson.dependencies['@minecraft/vanilla-data'] = newTargetApiVersion.releaseVersion;
  packageJson.dependencies['stdhub-plugin-api'] = `^${newStdhubApiVersion}`;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('Successfully patched `package.json`.');

  bpManifest.header.description = newDescription;
  bpManifest.header.min_engine_version = newMinEngineVersionArray;
  bpManifest.header.version = newVersionArray;
  bpManifest.modules[0].version = newVersionArray;
  bpManifest.dependencies[0].version = `${newTargetApiVersion.apiVersion}-beta`;
  bpManifest.dependencies[bpManifest.dependencies.length - 1].version = newVersionArray;
  fs.writeFileSync(bpManifestLocation, JSON.stringify(bpManifest, null, 2));

  rpManifest.header.description = newDescription;
  rpManifest.header.min_engine_version = newMinEngineVersionArray;
  rpManifest.header.version = newVersionArray;
  rpManifest.modules[0].version = newVersionArray;
  rpManifest.dependencies[0].version = newVersionArray;
  fs.writeFileSync(rpManifestLocation, JSON.stringify(rpManifest, null, 2));
  console.log('Successfully patched `manifest.json`s.');
}