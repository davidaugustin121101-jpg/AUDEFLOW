import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Plus, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { PricelistDeleteButton } from '@/components/pricelist/delete-button'

const statusIcon = {
  ready: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  processing: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
}
const statusLabel = {
  ready: 'Připraven',
  processing: 'Zpracovávám…',
  error: 'Chyba',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ready: 'default',
  processing: 'secondary',
  error: 'destructive',
}

export default async function PricelistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const { data: files } = await supabase
    .from('pricelist_files')
    .select('*')
    .eq('company_id', profile?.company_id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ceníky</h1>
          <p className="text-gray-500 mt-1">Spravujte nahrané ceníky a katalogy produktů</p>
        </div>
        <Link href="/pricelist/upload">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="h-4 w-4" />
            Nahrát ceník
          </Button>
        </Link>
      </div>

      {!files?.length ? (
        <Card className="shadow-none border-gray-200 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Zatím žádný ceník</h3>
            <p className="text-gray-500 text-sm text-center max-w-sm mb-6">
              Nahrajte Excel nebo CSV soubor s vašimi produkty. Systém je automaticky zpracuje a připraví pro AI asistenta.
            </p>
            <Link href="/pricelist/upload">
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-4 w-4" />
                Nahrát první ceník
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id} className="shadow-none border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{file.file_name}</p>
                      <Badge variant={statusVariant[file.status]} className="shrink-0 text-xs gap-1">
                        {statusIcon[file.status as keyof typeof statusIcon]}
                        {statusLabel[file.status as keyof typeof statusLabel]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 uppercase">{file.file_type}</span>
                      {file.row_count != null && (
                        <span className="text-xs text-gray-400">{file.row_count.toLocaleString('cs')} produktů</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(file.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                    {file.error_message && (
                      <p className="text-xs text-red-500 mt-1">{file.error_message}</p>
                    )}
                  </div>
                  <PricelistDeleteButton fileId={file.id} companyId={file.company_id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
