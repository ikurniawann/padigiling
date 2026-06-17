/**
 * WhatsApp Order Parser — shared module
 * Digunakan oleh Create Order page untuk parsing teks WhatsApp menjadi field terstruktur.
 *
 * Format yang didukung: key-value sederhana dan blok multi-baris.
 */

/**
 * Ekstrak baris tunggal: mencari label dalam teks, return value setelahnya.
 * Support multiple label variants (misal: "Nama pemesan" / "Nama Pemesan").
 */
export function pickLine(text: string, labels: string[]): string {
  const rows = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp('^' + escaped + '\\s*[:;]?\\s*(.*)$', 'i')
    const hit = rows.find((r) => rx.test(r))
    if (hit) return hit.replace(rx, '$1').trim()
  }
  return ''
}

/**
 * Ekstrak blok multi-baris: mencari label awal, ambil semua baris setelahnya
 * sampai ketemu label stop atau baris kosong berurutan.
 */
export function pickBlock(
  text: string,
  startLabels: string[],
  stopLabels: string[]
): string {
  const lines = text.split(/\r?\n/)
  let start = -1
  let first = ''

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    for (const label of startLabels) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const rx = new RegExp('^' + escaped + '\\s*[:;]?\\s*(.*)$', 'i')
      if (rx.test(raw)) {
        start = i
        first = raw.replace(rx, '$1').trim()
        break
      }
    }
    if (start > -1) break
  }

  if (start < 0) return ''

  const out: string[] = []
  if (first) out.push(first)

  for (let i = start + 1; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw) continue
    if (
      stopLabels.some((label) =>
        new RegExp(
          '^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:;]?',
          'i'
        ).test(raw)
      )
    )
      break
    out.push(raw)
  }

  return out.join('\n').trim()
}

/**
 * Parse WhatsApp order text lengkap menjadi structured object.
 */
export function parseWaOrder(raw: string) {
  return {
    customer_name: pickLine(raw, ['Nama pemesan', 'Nama Pemesan']),
    customer_phone: pickLine(raw, ['No telp', 'No telp pemesan', 'No HP pemesan']),
    recipient_name: pickLine(raw, ['Nama Penerima', 'Nama penerima']),
    recipient_phone: pickLine(raw, ['No Telp penerima', 'No telp penerima', 'No HP penerima']),
    order_text: pickBlock(raw, ['Order'], [
      'Delivery/pick up tgl', 'Delivery', 'Pick up', 'Jam',
      'Alamat', 'Apakah perlu kartu ucapan',
    ]),
    delivery_date_text: pickLine(raw, [
      'Delivery/pick up tgl', 'Delivery tgl', 'Pick up tgl', 'Tanggal',
    ]),
    delivery_time_text: pickLine(raw, ['Jam']),
    address: pickBlock(raw, ['Alamat'], [
      'Apakah perlu kartu ucapan', 'Mohon ditulis disini',
    ]),
    greeting_card_message: pickBlock(
      raw,
      ['Apakah perlu kartu ucapan', 'Mohon ditulis disini'],
      []
    ),
  }
}

export const DEFAULT_WA_TEMPLATE = `Silahkan isi form pemesanan di bawah ini 

Nama pemesan:
No telp:

Nama Penerima:
No Telp penerima:

Order:

Delivery/pick up tgl:
Jam:
Alamat:

Apakah perlu kartu ucapan?
Mohon ditulis disini

Setelah kami menerima pemesanan, akan kami kirim kan total pembelian/invoice.

Pembayaran dapat dilakukan lewat platform Paper.Id.

Note: pemesanan akan kami proses setelah pembayaran di verifikasi

Terima kasih 🙏`

export function getWaTemplate(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('wa_template') || DEFAULT_WA_TEMPLATE
  }
  return DEFAULT_WA_TEMPLATE
}
