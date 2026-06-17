import { describe, it, expect } from 'vitest'
import { pickLine, pickBlock, parseWaOrder } from '@/lib/wa-parser'

const sampleWa = `Nama pemesan: Budi Santoso
No telp: 08123456789

Nama Penerima: Ibu Ani
No Telp penerima: 08765432100

Order:
Tumpeng Nasi Kuning 50 porsi
+ Ayam Goreng Kremes 50 pcs
+ Sayur Urap
+ Sambal Terasi

Delivery/pick up tgl: 25 Mei 2026
Jam: 14.00 WIB
Alamat:
Jl. Merdeka No. 123
Jakarta Selatan
Depan Masjid Al-Ikhlas

Apakah perlu kartu ucapan?
Mohon ditulis disini
Selamat Ulang Tahun Ani ke-50 🎉
Dari Keluarga Besar Santoso`

describe('pickLine', () => {
  it('should extract simple key-value', () => {
    expect(pickLine(sampleWa, ['Nama pemesan'])).toBe('Budi Santoso')
  })

  it('should match case-insensitive', () => {
    expect(pickLine(sampleWa, ['nama pemesan', 'Nama Pemesan'])).toBe('Budi Santoso')
  })

  it('should return empty string when not found', () => {
    expect(pickLine(sampleWa, ['Email'])).toBe('')
  })

  it('should extract phone number', () => {
    expect(pickLine(sampleWa, ['No telp', 'No HP pemesan'])).toBe('08123456789')
  })
})

describe('pickBlock', () => {
  it('should extract multi-line block', () => {
    const order = pickBlock(sampleWa, ['Order'], ['Delivery/pick up tgl', 'Delivery', 'Jam'])
    expect(order).toContain('Tumpeng Nasi Kuning')
    expect(order).toContain('Ayam Goreng Kremes')
  })

  it('should extract address block', () => {
    const addr = pickBlock(sampleWa, ['Alamat'], ['Apakah perlu kartu ucapan'])
    expect(addr).toContain('Jl. Merdeka No. 123')
    expect(addr).toContain('Jakarta Selatan')
  })

  it('should return empty when no match', () => {
    expect(pickBlock(sampleWa, ['Catatan Tambahan'], [])).toBe('')
  })
})

describe('parseWaOrder', () => {
  it('should return structured object', () => {
    const result = parseWaOrder(sampleWa)
    expect(result.customer_name).toBe('Budi Santoso')
    expect(result.customer_phone).toBe('08123456789')
    expect(result.recipient_name).toBe('Ibu Ani')
    expect(result.order_text).toContain('Tumpeng Nasi Kuning')
    expect(result.delivery_date_text).toBe('25 Mei 2026')
    expect(result.delivery_time_text).toBe('14.00 WIB')
    expect(result.address).toContain('Jl. Merdeka')
    expect(result.greeting_card_message).toContain('Selamat Ulang Tahun')
  })
})
