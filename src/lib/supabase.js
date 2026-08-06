import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
	// Friendly warning to make production setup clearer when env vars are missing.
	// Vite inlines `import.meta.env.VITE_*` at build time — ensure these are set
	// in your Vercel Project -> Settings -> Environment Variables for Production.
	// This avoids cryptic build errors in CI.
	// eslint-disable-next-line no-console
	console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Set them in your environment.')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')