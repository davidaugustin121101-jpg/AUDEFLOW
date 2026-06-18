'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileSpreadsheet, X, Check, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnMapping } from '@/types'

type Step = 'upload' | 'mapping' | 'processing' | 'done'

interface PreviewRow {
  [key: string]: string | number | null
}

const REQUIRED_FIELDS: Array<{ key: keyof ColumnMapping; label: string; required: boolean }> = [
  { key: 'code', label: 'Kód produktu', required: true },
  { key: 'name', label: 'Název produktu', required: true },
  { key: 'price', label: 'Cena (bez DPH)', required: true },
  { key: 'unit', label: 'Jednotka (ks, m, kg…)', required: false },
  { key: 'stock_qty', label: 'Skladové množství', required: false },
]

export function PricelistUploader() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({})
  const [progress, setProgress] = useState(0)
  const [uploadedCount, setUploadedCount] = useState(0)

  const parseFile = useCallback(async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') {
      return new Promise<{ columns: string[]; rows: PreviewRow[] }>((resolve, reject) => {
        Papa.parse(f, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const cols = results.meta.fields ?? []
            resolve({ columns: cols, rows: (results.data as PreviewRow[]).slice(0, 5) })
          },
          error: reject,
        })
      })
    } else {
      const buffer = await f.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json<PreviewRow>(ws, { defval: null })
      const cols = data.length > 0 ? Object.keys(data[0]) : []
      return { columns: cols, rows: data.slice(0, 5) }
    }
  }, [])

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    try {
      const { columns: cols, rows } = await parseFile(f)
      setColumns(cols)
      setPreviewRows(rows)
      // Auto-map obvious column names
      const autoMap: Partial<ColumnMapping> = {}
      for (const col of cols) {
        const lower = col.toLowerCase()
        if (!autoMap.code && /k[oó]d|code|sku|id|č\./.test(lower)) autoMap.code = col
        if (!autoMap.name && /n[aá]zev|name|popis|description|produkt/.test(lower)) autoMap.name = col
        if (!autoMap.price && /cena|price|kč|czk/.test(lower)) autoMap.price = col
        if (!autoMap.unit && /jednotk|unit|mj/.test(lower)) autoMap.unit = col
        if (!autoMap.stock_qty && /sklad|stock|qty|množstv/.test(lower)) autoMap.stock_qty = col
      }
      setMapping(autoMap)
      setStep('mapping')
    } catch {
      toast.error('Nepodařilo se přečíst soubor. Zkuste jiný formát.')
    }
  }, [parseFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/plain': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  })

  async function handleProcess() {
    if (!file || !mapping.code || !mapping.name || !mapping.price) {
      toast.error('Namapujte povinná pole: Kód, Název, Cena')
      return
    }
    setStep('processing')
    setProgress(5)

    // 1. Get company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Nejste přihlášen'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!profile?.company_id) { toast.error('Firma nenalezena'); return }

    setProgress(15)

    // 2. Parse full file
    const ext = file.name.split('.').pop()?.toLowerCase()
    let allRows: PreviewRow[] = []
    try {
      if (ext === 'csv') {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (r) => { allRows = r.data as PreviewRow[]; resolve() },
            error: reject,
          })
        })
      } else {
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        allRows = XLSX.utils.sheet_to_json<PreviewRow>(ws, { defval: null })
      }
    } catch {
      toast.error('Chyba při čtení souboru')
      setStep('mapping')
      return
    }

    setProgress(30)

    // 3. Insert pricelist_file record
    const fileType = (ext === 'csv' ? 'csv' : 'excel') as 'csv' | 'excel'
    const { data: pfRecord, error: pfError } = await supabase
      .from('pricelist_files')
      .insert({
        company_id: profile.company_id,
        uploaded_by: user.id,
        file_name: file.name,
        storage_path: `${profile.company_id}/${Date.now()}_${file.name}`,
        file_type: fileType,
        row_count: allRows.length,
        status: 'processing',
      })
      .select('id')
      .single()

    if (pfError || !pfRecord) {
      toast.error('Chyba při ukládání záznamu ceníku')
      setStep('mapping')
      return
    }

    setProgress(40)

    // 4. Upsert products in batches of 200
    const BATCH = 200
    let inserted = 0
    for (let i = 0; i < allRows.length; i += BATCH) {
      const batch = allRows.slice(i, i + BATCH)
      const products = batch
        .map((row) => {
          const code = String(row[mapping.code!] ?? '').trim()
          const name = String(row[mapping.name!] ?? '').trim()
          const priceRaw = row[mapping.price!]
          const price = priceRaw != null ? parseFloat(String(priceRaw).replace(',', '.')) : null
          if (!code || !name) return null
          return {
            company_id: profile.company_id,
            pricelist_id: pfRecord.id,
            code,
            name,
            price: isNaN(price!) ? null : price,
            unit: mapping.unit ? String(row[mapping.unit] ?? '').trim() || null : null,
            stock_qty: mapping.stock_qty ? parseFloat(String(row[mapping.stock_qty] ?? '').replace(',', '.')) || null : null,
            currency: 'CZK',
          }
        })
        .filter(Boolean) as object[]

      if (products.length > 0) {
        const { error } = await supabase
          .from('products')
          .upsert(products, { onConflict: 'company_id,code', ignoreDuplicates: false })
        if (error) console.error('batch upsert error', error)
      }

      inserted += batch.length
      setProgress(40 + Math.round((inserted / allRows.length) * 50))
    }

    // 5. Mark pricelist as ready
    await supabase
      .from('pricelist_files')
      .update({ status: 'ready', row_count: allRows.length })
      .eq('id', pfRecord.id)

    setUploadedCount(allRows.length)
    setProgress(100)
    setStep('done')
  }

  if (step === 'upload') {
    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Upload className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {isDragActive ? 'Pusťte soubor zde…' : 'Přetáhněte soubor nebo klikněte'}
            </p>
            <p className="text-sm text-gray-400 mt-1">Excel (.xlsx, .xls) nebo CSV • max. 20 MB</p>
          </div>
          <Button type="button" variant="outline">Vybrat soubor</Button>
        </div>
      </div>
    )
  }

  if (step === 'mapping') {
    return (
      <div className="space-y-6">
        {/* File info */}
        <Card className="shadow-none border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">{file?.name}</p>
              <p className="text-xs text-gray-400">{columns.length} sloupců nalezeno</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setFile(null); setStep('upload') }}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Column mapping */}
        <Card className="shadow-none border-gray-200">
          <CardContent className="p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Mapování sloupců</h3>
              <p className="text-sm text-gray-500">Přiřaďte sloupce z vašeho souboru k polím systému. Povinná pole jsou označena *.</p>
            </div>
            {REQUIRED_FIELDS.map(({ key, label, required }) => (
              <div key={key} className="grid grid-cols-2 gap-4 items-center">
                <Label className="text-sm">
                  {label} {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={mapping[key] ?? '__none__'}
                  onValueChange={(val) =>
                    setMapping((prev) => ({ ...prev, [key]: val === '__none__' ? undefined : val }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="— nevybráno —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— nevybráno —</SelectItem>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preview */}
        {previewRows.length > 0 && mapping.code && mapping.name && (
          <Card className="shadow-none border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Náhled (prvních 5 řádků)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {(['code', 'name', 'price', 'unit'] as const).map((k) =>
                        mapping[k] ? (
                          <th key={k} className="text-left px-4 py-2 text-gray-500 font-medium">{REQUIRED_FIELDS.find(f => f.key === k)?.label}</th>
                        ) : null
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        {(['code', 'name', 'price', 'unit'] as const).map((k) =>
                          mapping[k] ? (
                            <td key={k} className="px-4 py-2 text-gray-700 max-w-[200px] truncate">
                              {String(row[mapping[k]!] ?? '—')}
                            </td>
                          ) : null
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => { setFile(null); setStep('upload') }}>
            ← Zpět
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 gap-2"
            onClick={handleProcess}
            disabled={!mapping.code || !mapping.name || !mapping.price}
          >
            Zpracovat a nahrát <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <Card className="shadow-none border-gray-200">
        <CardContent className="py-16 flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">Zpracovávám ceník…</p>
            <p className="text-gray-500 text-sm mt-1">Nahrávám produkty do databáze</p>
          </div>
          <div className="w-full max-w-sm">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-400 text-center mt-2">{progress}%</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Done
  return (
    <Card className="shadow-none border-gray-200">
      <CardContent className="py-16 flex flex-col items-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-lg">Hotovo!</p>
          <p className="text-gray-500 text-sm mt-1">
            Úspěšně nahráno <strong>{uploadedCount.toLocaleString('cs')}</strong> produktů do databáze.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setFile(null); setStep('upload') }}>
            Nahrát další ceník
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/pricelist')}>
            Zobrazit ceníky
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
