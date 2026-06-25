'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Heslo musí mít alespoň 8 znaků')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Účet vytvořen!')
    router.push('/faktury/upload')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Audeflow AI</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Vytvořit účet zdarma</h1>
          <p className="text-sm text-gray-500 mb-6">10 faktur měsíčně zdarma · Bez kreditní karty</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan@firma.cz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimálně 8 znaků"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Registrovat se zdarma
            </Button>
          </form>

          {/* Features list */}
          <ul className="mt-5 space-y-1.5">
            {[
              '10 faktur zdarma každý měsíc',
              'Přímé napojení iDoklad & Fakturoid',
              'Claude AI navrhne účetní kód',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <p className="text-xs text-gray-400 text-center mt-5">
            Registrací souhlasíte s{' '}
            <a href="mailto:podpora@audeflow.cz" className="underline">podmínkami</a>.
          </p>
        </div>

        <p className="text-sm text-gray-500 text-center mt-4">
          Už máte účet?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Přihlásit se
          </Link>
        </p>
      </div>
    </div>
  )
}
