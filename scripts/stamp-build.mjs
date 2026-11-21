import { readFile, writeFile } from 'node:fs/promises';

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const sha = process.env.GITHUB_SHA;
if (!/^[0-9a-f]{40}$/i.test(sha ?? '')) throw new Error('GITHUB_SHA tidak valid.');

for (const file of ['index.html', 'ucapan/index.html']) {
  const path = new URL(`../public/${file}`, import.meta.url);
  const html = await readFile(path, 'utf8');
  const marker = /(<span data-site-build>)[^<]+(<\/span>)/g;
  if ([...html.matchAll(marker)].length !== 1) throw new Error(`Penanda build tidak ditemukan atau duplikat: ${file}`);
  await writeFile(path, html.replace(marker, (_, awal, akhir) => `${awal}Build ${version}+${sha.slice(0, 7)}${akhir}`));
}
