import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Zap, Clock, CheckCircle2, Mail, Database, FileSpreadsheet } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">Audeflow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Přihlásit se</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Zkusit zdarma
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
        <Badge variant="secondary" className="mb-6 text-blue-700 bg-blue-50 border-blue-200">
          AI asistent pro B2B obchodníky
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Z chaotického e-mailu<br />
          <span className="text-blue-600">hotová nabídka za 30 sekund</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Audeflow AI přečte poptávku, spáruje položky s vaším ceníkem a navrhne
          kalkulaci přímo v Outlooku nebo Gmailu. Vy jen zkontrolujete a odešlete.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
              Začít zdarma – 14 dní <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base">
            Jak to funguje?
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Jak Audeflow AI funguje</h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">Tři kroky k tomu, abyste nabídku poslali dřív než konkurence.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileSpreadsheet,
                step: '01',
                title: 'Nahrajte ceník',
                desc: 'Drag & drop vašeho Excelu nebo CSV do portálu. Systém ho přečte, zmapuje sloupce a uloží produkty do databáze.',
              },
              {
                icon: Mail,
                step: '02',
                title: 'Otevřete poptávku v mailu',
                desc: 'V Outlooku nebo Gmailu klikněte na tlačítko Audeflow AI. Boční panel okamžitě zanalyzuje text e-mailu.',
              },
              {
                icon: CheckCircle2,
                step: '03',
                title: 'Zkontrolujte a odešlete',
                desc: 'AI navrhne editovatelnou tabulku s kódy, cenami a množstvím. Upravte co chcete a vložte nabídku do e-mailu.',
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-blue-100">{step}</span>
                  <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-blue-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Kalkulace úspory</h2>
          <p className="text-blue-100 mb-10 max-w-lg mx-auto">
            Průměrný obchodník stráví manuálním nacenění 2,5 hodiny denně.
            Audeflow AI to zvládne za 30 sekund.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { value: '2,5 hod', label: 'ušetřeno denně / obchodník' },
              { value: '50 hod', label: 'ušetřeno měsíčně / obchodník' },
              { value: '10×', label: 'rychlejší Speed to Lead' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-black mb-2">{value}</div>
                <div className="text-blue-200 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Ceník</h2>
          <p className="text-center text-gray-500 mb-14">Vyberte plán podle velikosti vašeho týmu.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'START',
                price: '2 900',
                desc: 'Pro menší týmy a živnostníky',
                features: ['2 uživatelé', '1 ceník (max 500 položek)', 'Gmail + Outlook add-in', 'E-mailová podpora'],
                highlight: false,
              },
              {
                name: 'BUSINESS',
                price: '6 900',
                desc: 'Pro střední velkoobchody',
                features: ['10 uživatelů', 'Neomezené ceníky', 'Prioritní podpora', 'Export do PDF', 'Firemní pravidla a slevy'],
                highlight: true,
              },
              {
                name: 'ENTERPRISE',
                price: '15 000+',
                desc: 'Custom integrace na ERP',
                features: ['Neomezení uživatelé', 'Napojení na ERP/WMS', 'SLA 99.9%', 'Dedikovaný account manager', 'On-premise možnost'],
                highlight: false,
              },
            ].map(({ name, price, desc, features, highlight }) => (
              <div
                key={name}
                className={`rounded-2xl p-8 border ${highlight ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-white border-gray-200'}`}
              >
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${highlight ? 'text-blue-200' : 'text-blue-600'}`}>{name}</div>
                <div className="text-3xl font-black mb-1">{price} <span className="text-base font-normal">Kč/měs</span></div>
                <p className={`text-sm mb-6 ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>{desc}</p>
                <ul className="space-y-2 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${highlight ? 'text-blue-200' : 'text-blue-600'}`} />
                      <span className={highlight ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className={`w-full ${highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    Vybrat plán
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Audeflow AI</span>
          </div>
          <p className="text-sm text-gray-400">© 2025 Audeflow AI s.r.o. Všechna práva vyhrazena.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-700">Podmínky</a>
            <a href="#" className="hover:text-gray-700">Soukromí</a>
            <a href="#" className="hover:text-gray-700">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
