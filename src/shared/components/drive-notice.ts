import type { State } from '../../integrations/google-drive/session'
import type { NoticeTone } from './Notice'

export function driveNotice(state: State): { tone: NoticeTone; message: string } | null {
  if (state.phase === 'error' || state.syncPhase === 'error' || state.syncPhase === 'conflict') return { tone: 'error', message: state.message }
  if (state.cacheError) return { tone: 'warning', message: state.cacheError }
  if (['authorizing', 'loading', 'saving'].includes(state.phase)) return { tone: 'info', message: state.message }
  if (state.pending || state.queued) return { tone: 'warning', message: state.message.includes('pendente') ? state.message : state.cached ? 'Alterações salvas no navegador, pendentes de sincronização.' : 'Alterações pendentes de sincronização. Sem cache disponível, sincronize antes de recarregar.' }
  if (state.phase === 'expired') return { tone: 'warning', message: state.message }
  if (state.phase === 'ready') return { tone: state.message.includes('versão mais recente') ? 'warning' : 'success', message: state.message }
  if (state.snapshot === undefined) return { tone: 'warning', message: 'Conecte o Drive para carregar sua biblioteca.' }
  return null
}

