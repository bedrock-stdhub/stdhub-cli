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
  const filtered = rawVersionList
    .filter(version => versionExp.test(version))
    .map(matchedVersion => matchedVersion.match(versionExp)![1]);
  const reduced = new Set(filtered);
  return (<string[]>Array.from(reduced).reverse()).map(mcDependencyVersion => {
    const original = filtered.findLast(value => value.startsWith(mcDependencyVersion))!;
    const [ , apiVersion, releaseVersion ] = mcDependencyVersion.match(reducedVersionExp)!;
    return { original, mcDependencyVersion, apiVersion, releaseVersion };
  });
}