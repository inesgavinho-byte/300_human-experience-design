import { cp, mkdir } from 'node:fs/promises';

const output = '.next';
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'script.js']) {
  await cp(file, `${output}/${file}`);
}
console.log('Static site prepared in .next');
