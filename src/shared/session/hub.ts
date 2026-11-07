import { createFirebaseAuth } from '../../integrations/firebase/auth'
import { CloudSession } from '../../integrations/google-drive/session'
import { AuthSession, type AuthPort } from './auth-session'
export class Hub {
  readonly auth: AuthSession
  readonly cloud: CloudSession
  constructor(port: AuthPort, cloud?: CloudSession) {
    this.cloud = cloud ?? new CloudSession(undefined, () => this.auth.isValid() ? this.auth.getSnapshot().identity?.googleId : undefined)
    this.auth = new AuthSession(port, () => this.cloud.disconnect())
  }
}
let defaultHub: Hub | undefined
export const getDefaultHub = () => defaultHub ??= new Hub(createFirebaseAuth())
