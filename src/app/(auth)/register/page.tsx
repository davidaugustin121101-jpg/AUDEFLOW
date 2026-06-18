'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
  })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Heslo musí mít alespoň 8 znaků')
      return
    }
    setLoading(true)

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
      },
    })

    if (authError || !authData.user) {
      toast.error(authError?.message ?? 'Chyba při registraci')
      setLoading(false)
      return
    }

    const userId = authData.user.id
    const slug = form.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + userId.slice(0, 6)

    // 2. Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: form.companyName, slug })
      .select('id')
      .single()

    if (companyError || !company) {
      toast.error('Chyba při vytváření firmy')
      setLoading(false)
      return
    }

    // 3. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        company_id: company.id,
        full_name: form.fullName,
        role: 'owner',
      })

    if (profileError) {
      toast.error('Chyba při vytváření profilu')
      setLoading(false)
      return
    }

    toast.success('Účet vytvořen! Přihlašování…')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Audeflow AI</span>
          </Link>
        </div>
        <Card className="shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Vytvořit účet</CardTitle>
            <CardDescription>Začněte zdarma, bez kreditní karty</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Vaše jméno</Label>
                <Input
                  id="fullName"
                  placeholder="Jan Novák"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Název firmy</Label>
                <Input
                  id="companyName"
                  placeholder="ACME Velkoobchod s.r.o."
                  value={form.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Pracovní e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jan@acme.cz"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimálně 8 znaků"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vytvořit účet zdarma
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Registrací souhlasíte s{' '}
                <a href="#" className="underline">podmínkami</a> a{' '}
                <a href="#" className="underline">zásadami ochrany soukromí</a>.
              </p>
              <p className="text-sm text-gray-500 text-center">
                Máte účet?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Přihlásit se
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
