import { createContext, useContext, useSyncExternalStore } from 'react'
import type { Hub } from './hub'
export const HubContext = createContext<Hub | null>(null)
export function useHub() { const hub = useContext(HubContext); if (!hub) throw new Error('HubProvider ausente'); return hub }
export function useAuth() { const hub = useHub(); return useSyncExternalStore(hub.auth.subscribe, hub.auth.getSnapshot) }
