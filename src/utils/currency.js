export const PKR_PER_USD = 280;

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPkrAsUsd(amount) {
  const pkr = Number(amount);
  return usdFormatter.format(Number.isFinite(pkr) ? pkr / PKR_PER_USD : 0);
}

export function usdToPkr(amount) {
  const usd = Number(amount);
  return Number.isFinite(usd) ? Math.round(usd * PKR_PER_USD * 100) / 100 : 0;
}
