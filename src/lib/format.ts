export const rp = (n: number): string =>
  'Rp ' + Math.round(n || 0).toLocaleString('id-ID')
