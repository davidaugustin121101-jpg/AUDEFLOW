import { redirect } from 'next/navigation'

// The root route is handled by next.config.ts beforeFiles rewrite → public/index.html
// This server component acts as a fallback redirect.
export default function Home() {
  redirect('/index.html')
}
