import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'family-tree-static-files',
    apply: 'build',
    async generateBundle() {
      for (const fileName of ['manifest.json', 'service-worker.js', 'robots.txt', 'sitemap.xml']) {
        this.emitFile({
          type: 'asset',
          fileName,
          source: await readFile(new URL(`./${fileName}`, import.meta.url), 'utf8')
        });
      }
    }
  }]
});
