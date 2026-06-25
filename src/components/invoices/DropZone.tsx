'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setError('Nahraj prosím PDF soubor')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Soubor je příliš velký (max 10 MB)')
        return
      }

      setIsLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Chyba při zpracování')
          return
        }
        router.push(`/faktury/${data.invoice.id}`)
      } catch {
        setError('Nepodařilo se připojit k serveru')
      } finally {
        setIsLoading(false)
      }
    },
    [router]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // reset so same file can be re-uploaded
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-200',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/30',
          isLoading && 'opacity-70 pointer-events-none'
        )}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          id="invoice-file-input"
          onChange={onFileInput}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              </div>
            </div>
            <div>
              <p className="text-gray-700 font-semibold">Claude čte fakturu…</p>
              <p className="text-gray-400 text-sm mt-1">Obvykle do 5 sekund</p>
            </div>
          </div>
        ) : (
          <label htmlFor="invoice-file-input" className="cursor-pointer block">
            <div className="flex flex-col items-center gap-4">
              <div
                className={cn(
                  'h-16 w-16 rounded-2xl flex items-center justify-center transition-colors',
                  isDragging ? 'bg-blue-100' : 'bg-gray-100'
                )}
              >
                <Upload
                  className={cn(
                    'h-8 w-8 transition-colors',
                    isDragging ? 'text-blue-600' : 'text-gray-400'
                  )}
                />
              </div>
              <div>
                <p className="text-gray-700 font-semibold text-lg">
                  {isDragging ? 'Pusť soubor zde' : 'Přetáhni PDF fakturu sem'}
                </p>
                <p className="text-gray-400 mt-1 text-sm">nebo klikni pro výběr souboru</p>
              </div>
              <span className="text-xs text-gray-300 bg-gray-100 px-3 py-1 rounded-full">
                PDF · max 10 MB
              </span>
            </div>
          </label>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 text-lg">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
