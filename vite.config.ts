import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig(({ mode }) => {
  const commit = mode === 'development' ? 'development' : execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  const metadata = { version, commit }

  return {
    base: process.env.APP_BASE_PATH || '/',
    plugins: [react(), {
      name: 'release-metadata',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(metadata) + '\n' })
      },
    }],
    define: { __APP_VERSION__: JSON.stringify(version), __COMMIT_SHA__: JSON.stringify(commit) },
  }
})
