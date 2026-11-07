import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function validateRelease({ manifest, lock, changes }) {
  const version = manifest.version
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version ?? '')) throw new Error('A versão deve ser SemVer estável (ex.: 0.1.0).')
  if (lock.version !== version || lock.packages?.['']?.version !== version) throw new Error('A versão do lockfile diverge do package.json.')
  if (!changes.length) throw new Error('A entrega deve selecionar pelo menos uma change.')
  for (const change of changes) {
    const declared = change.proposal.match(/^## Version\s*\n\s*`(\d+\.\d+\.\d+)`/m)?.[1]
    if (declared !== version) throw new Error(`A change ${change.name} tem versão ${declared ?? 'ausente'}, diferente de ${version}.`)
  }
  return { version, tag: `v${version}`, changes: changes.map((change) => change.name) }
}

export function readRelease(root = process.cwd()) {
  const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
  const selection = readJson('.release.json')
  if (!Array.isArray(selection.changes) || new Set(selection.changes).size !== selection.changes.length) throw new Error('Seleção de changes inválida ou duplicada.')
  const archivedChanges = selection.archivedChanges ?? {}
  if (typeof archivedChanges !== 'object' || Array.isArray(archivedChanges)) throw new Error('Referências de arquivo inválidas.')
  const changes = selection.changes.map((name) => {
    if (typeof name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error('Nome de change inválido.')
    const archivedName = Object.hasOwn(archivedChanges, name) ? archivedChanges[name] : undefined
    if (archivedName !== undefined && (typeof archivedName !== 'string' || !new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${name}$`).test(archivedName))) {
      throw new Error(`Referência de arquivo inválida para ${name}.`)
    }
    const proposalPath = archivedName === undefined
      ? resolve(root, 'openspec/changes', name, 'proposal.md')
      : resolve(root, 'openspec/changes/archive', archivedName, 'proposal.md')
    return { name, proposal: readFileSync(proposalPath, 'utf8') }
  })
  return validateRelease({ manifest: readJson('package.json'), lock: readJson('package-lock.json'), changes })
}

export function tagDecision(existingCommit, commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Commit de release inválido.')
  if (!existingCommit) return 'create'
  if (existingCommit === commit) return 'reuse'
  throw new Error('A tag já pertence a outro commit; ela não será movida.')
}
