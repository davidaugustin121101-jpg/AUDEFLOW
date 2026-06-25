import Link from 'next/link'
import { ArrowRight, CheckCircle2, Zap, Shield, Clock, FileText } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Audeflow AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Přihlásit se
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Zkusit zdarma
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap className="h-3.5 w-3.5" />
          Přímé API napojení na iDoklad a Fakturoid
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
          Z PDF faktury do{' '}
          <span className="text-blue-600">iDokladu</span>
          <br />
          jedním kliknutím
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Přetáhni PDF fakturu od dodavatele. Claude AI ji přečte, navrhne účetní kód
          a odešle přímo do iDokladu nebo Fakturoidu. Žádné ruční přepisování,
          žádný export souboru.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-blue-100"
          >
            Začít zdarma – 10 faktur
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Už mám účet →
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">Bez kreditní karty · Okamžitě</p>
      </section>

      {/* Comparison strip */}
      <section className="bg-gray-50 border-y border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">
            Proč ne ruční import?
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
                Bez Audeflow (dnes)
              </p>
              <ol className="space-y-3">
                {[
                  'Otevřeš email, stáhneš PDF',
                  'Otevřeš iDoklad nebo Fakturoid',
                  'Ručně přepíšeš dodavatele, IČO, částku…',
                  'Vybereš účetní kód ze seznamu',
                  'Zkontroluješ a uložíš',
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="mt-0.5 h-5 w-5 rounded-full bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-gray-400">⏱ ~5–10 minut na fakturu</p>
            </div>

            <div className="bg-blue-600 rounded-2xl p-6 text-white">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wide mb-4">
                S Audeflow
              </p>
              <ol className="space-y-3">
                {[
                  'Přetáhneš PDF na stránku',
                  'Claude přečte fakturu a navrhne účetní kód',
                  'Zkontroluješ a klikneš „Odeslat"',
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-blue-50">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-300 shrink-0" />
                    {s}
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-blue-200">⚡ ~30 sekund na fakturu</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
          Jak to funguje
        </h2>
        <p className="text-center text-gray-500 mb-12">Tři kroky. Žádná instalace.</p>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: <FileText className="h-6 w-6 text-blue-600" />,
              step: '01',
              title: 'Přetáhni PDF',
              desc: 'Nahraj PDF fakturu od libovolného dodavatele. Také automaticky z Gmailu nebo Outlooku.',
            },
            {
              icon: <Zap className="h-6 w-6 text-purple-600" />,
              step: '02',
              title: 'Claude navrhne účetní kód',
              desc: 'AI přečte dodavatele, IČO, částku, DPH a navrhne správný účetní kód (518, 022, 501…) podle české účtové osnovy.',
            },
            {
              icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
              step: '03',
              title: 'Odešleš jedním kliknutím',
              desc: 'Zkontroluješ data, případně upravíš a klikneš Odeslat. Faktura je okamžitě v iDokladu nebo Fakturoidu.',
            },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gray-50 mb-4">
                {icon}
              </div>
              <p className="text-xs font-bold text-gray-300 mb-1">{step}</p>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Vše co potřebuješ
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '🧾', title: 'iDoklad & Fakturoid', desc: 'Přímé API napojení – žádný export, žádný import ručně.' },
              { icon: '🤖', title: 'Automatický účetní kód', desc: 'Claude navrhuje kód (518, 022, 501…) a vysvětluje proč.' },
              { icon: '📧', title: 'Sledování emailu', desc: 'Faktury z Gmailu, Outlooku nebo IMAP zpracuje automaticky.' },
              { icon: '🔒', title: 'Bezpečnost', desc: 'PDF se nikde neukládá. API klíče šifrujeme v Supabase Vault.' },
              { icon: '✅', title: 'Vždy náhled před odesláním', desc: 'Žádná akce bez tvého potvrzení. Plná kontrola.' },
              { icon: '📊', title: 'Confidence score', desc: 'Každé pole má jistotu 0–100 %. Nejistá pole vidíš ihned.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-20" id="cenik">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Ceník</h2>
        <p className="text-center text-gray-500 mb-12">
          Platíte ručně převodem na fakturu. Stripe přidáme brzy.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              name: 'Free',
              price: '0 Kč',
              period: '/ měsíc',
              desc: 'Pro vyzkoušení',
              features: ['10 faktur měsíčně', 'iDoklad & Fakturoid', 'Claude AI extrakce'],
              cta: 'Začít zdarma',
              href: '/register',
              highlight: false,
            },
            {
              name: 'Starter',
              price: '299 Kč',
              period: '/ měsíc',
              desc: 'Pro malé firmy',
              features: ['100 faktur měsíčně', 'iDoklad & Fakturoid', 'Gmail & Outlook napojení', 'Email podpora'],
              cta: 'Vybrat Starter',
              href: '/register',
              highlight: true,
            },
            {
              name: 'Pro',
              price: '599 Kč',
              period: '/ měsíc',
              desc: 'Pro e-shopy a větší firmy',
              features: ['Neomezený počet faktur', 'iDoklad & Fakturoid', 'Všechny email zdroje', 'Prioritní podpora'],
              cta: 'Vybrat Pro',
              href: '/register',
              highlight: false,
            },
          ].map(({ name, price, period, desc, features, cta, href, highlight }) => (
            <div
              key={name}
              className={`rounded-2xl border p-6 flex flex-col ${
                highlight
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-100'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <p className={`text-sm font-semibold mb-1 ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                {name}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-3xl font-extrabold ${highlight ? 'text-white' : 'text-gray-900'}`}>
                  {price}
                </span>
                <span className={`text-sm ${highlight ? 'text-blue-200' : 'text-gray-400'}`}>{period}</span>
              </div>
              <p className={`text-xs mb-5 ${highlight ? 'text-blue-200' : 'text-gray-400'}`}>{desc}</p>

              <ul className="space-y-2 flex-1 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${highlight ? 'text-blue-200' : 'text-green-500'}`}
                    />
                    <span className={highlight ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                  highlight
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Po registraci napište na{' '}
          <a href="mailto:podpora@audeflow.cz" className="underline">
            podpora@audeflow.cz
          </a>{' '}
          pro upgrade plánu.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Zkus to na první faktuře zdarma
          </h2>
          <p className="text-blue-100 mb-8">
            Registrace za 30 sekund. Žádná kreditní karta.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-4 rounded-xl text-base transition-colors"
          >
            Začít zdarma
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Audeflow AI</span>
          </div>
          <p className="text-xs text-gray-400">
            Produkt{' '}
            <a href="https://audeflow.cz" className="underline hover:text-gray-600">
              audeflow.cz
            </a>{' '}
            · {new Date().getFullYear()}
          </p>
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="mailto:podpora@audeflow.cz" className="hover:text-gray-600">
              podpora@audeflow.cz
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
