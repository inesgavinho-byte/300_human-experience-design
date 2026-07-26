import { cp, mkdir } from 'node:fs/promises';

const output = '.next';
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'script.js']) {
  await cp(file, `${output}/${file}`);
}
await cp('assets', `${output}/assets`, { recursive: true });
console.log('Static site and media prepared in .next');
