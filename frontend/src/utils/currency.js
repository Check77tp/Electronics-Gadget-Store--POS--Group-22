// Single source of truth for money display across the app -- the store
// trades in Zambian Kwacha (ZMW), symbol "K" (e.g. K150.00). Every screen
// imports this instead of formatting its own currency string, so changing
// currency again later is a one-line edit instead of a dozen.

const CURRENCY_SYMBOL = 'K';

export function formatMoney(value, { decimals = 2 } = {}) {
  const amount = Number(value ?? 0);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${CURRENCY_SYMBOL}${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
