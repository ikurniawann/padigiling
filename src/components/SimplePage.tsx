import { AppShell } from './AppShell'
import { PageHeader } from './PageHeader'
export function SimplePage({title,subtitle}:{title:string;subtitle:string}){return <AppShell><PageHeader title={title} subtitle={subtitle}/><div className="glass rounded-3xl p-5"><p className="text-sm text-stone-600">Halaman {title} siap dimigrasikan ke data Supabase.</p></div></AppShell>}
