// Real Firebase SDK and application controller, with provider credential issuance
// replaced only in this test-only entry; REST responses are intercepted by tests.
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { createFirebaseAuth } from '../../../src/integrations/firebase/auth'
import { App } from '../../../src/app/App'
import { Hub } from '../../../src/shared/session/hub'
import '../../../src/app/styles.css'
const port = createFirebaseAuth()
port.login = async () => { await signInWithCredential(getAuth(), GoogleAuthProvider.credential('synthetic-provider-credential')) }
createRoot(document.getElementById('root')!).render(<HashRouter><App hub={new Hub(port)} /></HashRouter>)
