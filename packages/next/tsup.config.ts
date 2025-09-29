import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/app/route.ts', 'src/middleware/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['@airauth/core', 'next', 'react', 'react-dom'],
});
