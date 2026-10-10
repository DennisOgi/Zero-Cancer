export function paymentRefFromSearch(search: Record<string, unknown>) {
  const ref = search.ref ?? search.tx_ref
  return typeof ref === 'string' ? ref : ''
}
