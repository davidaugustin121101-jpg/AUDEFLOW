'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function PricelistDeleteButton({ fileId, companyId }: { fileId: string; companyId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm('Opravdu chcete smazat tento ceník a všechny jeho produkty?')) return
    setLoading(true)
    const { error } = await supabase.from('pricelist_files').delete().eq('id', fileId)
    if (error) {
      toast.error('Nepodařilo se smazat ceník')
    } else {
      toast.success('Ceník smazán')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-gray-400 hover:text-red-500"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
