import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { validateRelease, tagDecision } from './release.mjs'
import { ensureReleaseTag } from './tag.mjs'

const valid = () => ({ manifest: { version: '0.1.0' }, lock: { version: '0.1.0', packages: { '': { version: '0.1.0' } } }, changes: [{ name: 'shell', proposal: '# Proposal\n\n## Version\n\n`0.1.0` — shell' }] })

test('usa somente as changes selecionadas da entrega', () => {
  assert.deepEqual(validateRelease(valid()), { version: '0.1.0', tag: 'v0.1.0', changes: ['shell'] })
})
test('rejeita pacote e lockfile divergentes', () => {
  const data = valid(); data.lock.packages[''].version = '0.2.0'
  assert.throws(() => validateRelease(data), /lockfile/)
})
test('rejeita change sem versão ou com versão diferente', () => {
  for (const proposal of ['# Proposal', '## Version\n\n`0.2.0`']) {
    const data = valid(); data.changes[0].proposal = proposal
    assert.throws(() => validateRelease(data), /change shell/)
  }
})
test('rejeita entrega vazia e versão inválida', () => {
  const data = valid(); data.changes = []
  assert.throws(() => validateRelease(data), /pelo menos uma/)
  data.manifest.version = '01.0.0'
  assert.throws(() => validateRelease(data), /SemVer/)
})
test('rejeita commit inválido antes de criar tag', () => {
  assert.throws(() => tagDecision(undefined, 'main'), /inválido/)
})
test('cria, reutiliza e preserva uma tag remota sem mover referências', () => {
  const root = mkdtempSync(join(tmpdir(), 'my-hub-tags-'))
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  try {
    git(root, 'init', '--bare', 'remote.git')
    git(root, 'init', 'checkout')
    const cwd = join(root, 'checkout')
    git(cwd, 'config', 'user.name', 'Release test')
    git(cwd, 'config', 'user.email', 'release-test@example.invalid')
    git(cwd, 'remote', 'add', 'origin', join(root, 'remote.git'))
    writeFileSync(join(cwd, 'fixture.txt'), 'first')
    git(cwd, 'add', 'fixture.txt'); git(cwd, 'commit', '-m', 'first')
    const first = git(cwd, 'rev-parse', 'HEAD')
    assert.equal(ensureReleaseTag({ cwd, version: '0.1.0', commit: first }).decision, 'create')
    assert.equal(ensureReleaseTag({ cwd, version: '0.1.0', commit: first }).decision, 'reuse')
    writeFileSync(join(cwd, 'fixture.txt'), 'second')
    git(cwd, 'commit', '-am', 'second')
    const second = git(cwd, 'rev-parse', 'HEAD')
    assert.throws(() => ensureReleaseTag({ cwd, version: '0.1.0', commit: second }), /outro commit/)
    assert.ok(git(cwd, 'ls-remote', 'origin', 'refs/tags/v0.1.0').startsWith(first))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
