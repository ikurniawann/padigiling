import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status })
}

export function fail(message: string, status = 400, detail?: unknown) {
  return NextResponse.json({ data: null, error: { message, detail } }, { status })
}
