import { confirm, input } from '@inquirer/prompts';
import { versionMapping, versionRegex } from './init.js';
import fs from 'node:fs';
import path from 'node:path';

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
  const newTargetApiVersion = await input({
    message: 'New target API version:',
    default: packageJson.dependencies['@minecraft/server'].substring(1),
    validate: input => versionRegex.test(input) && (typeof versionMapping.get(input) === 'string'),
  });
  const newDescription = await input({
    message: 'New description:',
    default: packageJson.description,
  });
  const newVersionArray = newVersion.split('.').map(v => parseInt(v));
  const newTargetApiVersionArray = versionMapping.get(newTargetApiVersion)!.split('.').map(v => parseInt(v));

  console.log({ newVersion, newTargetApiVersion, newDescription });
  const ok = await confirm({
    message: 'Is that OK?',
  });
  if (!ok) {
    console.log('Info not confirmed. Please execute `npx stdhub-cli patch` again.');
    return;
  }

  packageJson.version = newVersion;
  packageJson.description = newDescription;
  packageJson.dependencies['@minecraft/server'] = `^${newTargetApiVersion}`;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('Successfully patched `package.json`.');

  bpManifest.header.description = newDescription;
  bpManifest.header.min_engine_version = newTargetApiVersionArray;
  bpManifest.header.version = newVersionArray;
  bpManifest.modules[0].version = newVersionArray;
  bpManifest.dependencies[1].version = newVersionArray;
  fs.writeFileSync(bpManifestLocation, JSON.stringify(bpManifest, null, 2));

  rpManifest.header.description = newDescription;
  rpManifest.header.min_engine_version = newTargetApiVersionArray;
  rpManifest.header.version = newVersionArray;
  rpManifest.modules[0].version = newVersionArray;
  rpManifest.dependencies[0].version = newVersionArray;
  fs.writeFileSync(rpManifestLocation, JSON.stringify(rpManifest, null, 2));
  console.log('Successfully patched `manifest.json`s.');
}