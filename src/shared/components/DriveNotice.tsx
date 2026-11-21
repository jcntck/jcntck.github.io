import type { State } from '../../integrations/google-drive/session'
import { Notice } from './Notice'
import { driveNotice } from './drive-notice'

export function DriveNotice({ state, successMessage }: { state: State; successMessage?: string }) {
  const notice = driveNotice(state)
  return notice && <Notice tone={notice.tone} message={notice.tone === 'success' && successMessage ? successMessage : notice.message} eventKey={state} />
}
