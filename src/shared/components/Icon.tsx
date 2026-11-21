import { Home, BookOpen, Cloud, PanelLeft, Plus, ArrowRight, ChevronDown, Sun, Moon, Sparkles, Search, Lightbulb, X, Link2, CloudUpload, CloudDownload, FlaskConical, RefreshCw, Unplug, LogOut, Pencil, Trash2, ArrowUpDown, ExternalLink, AlertCircle, Info, Copy, Check, SearchX } from 'lucide-react'
const icons = { home: Home, book: BookOpen, cloud: Cloud, menu: PanelLeft, plus: Plus, arrow: ArrowRight, chevron: ChevronDown, sun: Sun, moon: Moon, sparkle: Sparkles, search: Search, bulb: Lightbulb, close: X, link: Link2, upload: CloudUpload, download: CloudDownload, flask: FlaskConical, refresh: RefreshCw, unplug: Unplug, logout: LogOut, edit: Pencil, trash: Trash2, order: ArrowUpDown, external: ExternalLink, alert: AlertCircle, info: Info, copy: Copy, check: Check, empty: SearchX } as const
export function Icon({ name, className = '' }: { name: keyof typeof icons; className?: string }) {
  const Component = icons[name]
  return <Component aria-hidden="true" className={`icon ${className}`} strokeWidth={2} />
}
