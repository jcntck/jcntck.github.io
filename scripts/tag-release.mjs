import { execFileSync } from 'node:child_process'
import { readRelease } from './release.mjs'
import { ensureReleaseTag } from './tag.mjs'

try {
  const { version } = readRelease()
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  console.log(JSON.stringify(ensureReleaseTag({ version, commit })))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
