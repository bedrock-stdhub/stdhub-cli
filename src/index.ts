#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import init from './init.js';
import patch from './patch.js';
import { getMinecraftServerApiVersionPrefixes } from './fetch-versions.js';

export const versionRegex = /^\d+\.\d+\.\d+$/;

console.log('Fetching @minecraft/server versions...');
export const versions = await getMinecraftServerApiVersionPrefixes();

const mainDefinitions = [
  { name: 'command', defaultOption: true },
];
const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
// const argv = mainOptions._unknown || []

switch (mainOptions.command) {
  case 'init': {
    await init();
    break;
  }
  case 'patch': {
    await patch();
    break;
  }
  default: {
    console.log(`Unknown command ${mainOptions.command}. Check docs for possible commands.`);
  }
}