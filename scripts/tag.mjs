import { execFileSync } from 'node:child_process'
import { tagDecision } from './release.mjs'

export function ensureReleaseTag({ cwd = process.cwd(), version, commit, remote = 'origin' }) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) throw new Error('Versão de tag inválida.')
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const tag = `v${version}`
  const refs = git('ls-remote', remote, `refs/tags/${tag}`, `refs/tags/${tag}^{}`)
    .split('\n').filter(Boolean).map((line) => line.split(/\s+/))
  const existing = refs.find(([, ref]) => ref.endsWith('^{}'))?.[0] ?? refs[0]?.[0]
  const decision = tagDecision(existing, commit)
  if (decision === 'create') {
    const localTags = git('tag', '--list', tag)
    if (localTags && git('rev-parse', `${tag}^{commit}`) !== commit) throw new Error('Tag local divergente; nenhuma tag será substituída.')
    if (!localTags) git('tag', tag, commit)
    git('push', remote, `refs/tags/${tag}:refs/tags/${tag}`)
  }
  return { tag, commit, decision }
}
