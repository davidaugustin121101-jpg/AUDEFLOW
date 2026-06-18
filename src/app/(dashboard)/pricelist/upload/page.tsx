import { PricelistUploader } from '@/components/pricelist/uploader'

export default function UploadPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nahrát ceník</h1>
        <p className="text-gray-500 mt-1">
          Nahrajte Excel (.xlsx, .xls) nebo CSV soubor s vašimi produkty.
          Systém ho zpracuje a připraví pro AI asistenta.
        </p>
      </div>
      <PricelistUploader />
    </div>
  )
}
