import { NextResponse } from 'next/server'
import { getMicrosoftAuthUrl } from '@/lib/outlook'

export async function GET() {
  const url = getMicrosoftAuthUrl()
  return NextResponse.json({ url })
}
