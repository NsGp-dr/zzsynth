import { defineConfig } from 'vite'

export default defineConfig({
  // SUSTITUYE 'zzsynth' por el nombre exacto de tu repositorio si es distinto
  base: '/zzsynth/', 
  build: {
    outDir: 'docs', // Así siempre que hagas build, se guardará en docs automáticamente
  }
})