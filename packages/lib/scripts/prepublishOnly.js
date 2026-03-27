import { copyFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Import JSON with proper ESM syntax
import rootPackage from '../../../package.json' with { type: 'json' };
import libPackage from '../package.json' with { type: 'json' };

async function copyReadme() {
  // Compute the destination path reliably
  const srcPatch = path.resolve(fileURLToPath(new URL('../../../README.md', import.meta.url)));
  const distPath = path.resolve(fileURLToPath(new URL('../dist/README.md', import.meta.url)));

  // Write updated package.json to dist
  await copyFile(srcPatch, distPath);

  // eslint-disable-next-line no-console
  console.log(`Copied README.md`);
}

async function generatePackageJson() {
  // Compute the destination path reliably
  const distPath = path.resolve(fileURLToPath(new URL('../package.json', import.meta.url)));

  // Merge relevant fields from root package.json into the dist package.json
  const pkg = {
    ...libPackage,
    bugs: rootPackage.bugs,
    description: rootPackage.description,
    homepage: rootPackage.homepage,
    name: rootPackage.name,
    repository: rootPackage.repository,
    version: rootPackage.version,
  };

  // Write updated package.json to dist
  await writeFile(distPath, JSON.stringify(pkg, null, 2));

  // eslint-disable-next-line no-console
  console.log(`Generated ${distPath} with version ${pkg.version}`);
}

await copyReadme();
await generatePackageJson();
