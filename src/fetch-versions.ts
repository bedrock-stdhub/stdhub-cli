import { exec } from 'child_process';

const versionExp = /^(\d+\.\d+\.\d+-beta\.\d+\.\d+\.\d+)-stable$/;
const reducedVersionExp = /^(\d+\.\d+\.\d+)-beta\.(\d+\.\d+\.\d+)$/;

export async function fetchVersions(packageName: string) {
  return new Promise<string[]>((resolve, reject) => {
    exec(`npm view ${packageName} versions --json`, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(<string[]>JSON.parse(stdout));
      }
    });
  });
}

/**
 * Version numbers in returned data is from high to low.
 */
export async function getMinecraftServerApiVersionPrefixes() {
  const rawVersionList = await fetchVersions('@minecraft/server');
  return rawVersionList
    .filter(version => versionExp.test(version))
    .map(original => {
      const reducedVersion = original.match(versionExp)![1];
      const [ , apiVersion, releaseVersion ] = reducedVersion.match(reducedVersionExp)!;
      return { original, apiVersion, releaseVersion };
    })
    .reverse();
}