import { readRelease } from './release.mjs'

try {
  const release = readRelease()
  console.log(`Release válida: ${release.tag} (${release.changes.join(', ')}).`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
