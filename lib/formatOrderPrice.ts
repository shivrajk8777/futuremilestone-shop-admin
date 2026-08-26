export function formatOrderPrice(value: any, currencySymbol?: string, currency?: string): string {
  if (value === undefined || value === null || value === "") return "$0.00";

  let strVal = String(value).trim();

  // Strip accidental prepended "$" if strVal starts with "$₹" or similar
  if (strVal.startsWith("$") && strVal.length > 1 && /^[₹$€£₨৳]/.test(strVal.slice(1))) {
    strVal = strVal.slice(1);
  }

  // Extract leading symbol if any
  const leadingSymbol = strVal.match(/^([₹$€£₨৳])/)?.[1];

  // If already formatted with a currency symbol
  if (leadingSymbol) {
    // If explicit currencySymbol is provided and differs from strVal's symbol, reformat clean number
    if (currencySymbol && strSymbolDiffers(leadingSymbol, currencySymbol)) {
      const cleanNum = Number(strVal.replace(/[^0-9.-]+/g, ""));
      if (!isNaN(cleanNum)) {
        return formatNumWithSymbol(cleanNum, currencySymbol, currency);
      }
    }
    return strVal;
  }

  // Extract raw number
  const cleanNum = Number(strVal.replace(/[^0-9.-]+/g, ""));
  if (isNaN(cleanNum)) {
    return strVal || "$0.00";
  }

  const symbol = currencySymbol || "$";
  return formatNumWithSymbol(cleanNum, symbol, currency);
}

function strSymbolDiffers(symbol1: string, symbol2: string): boolean {
  return symbol1 !== symbol2;
}

function formatNumWithSymbol(num: number, symbol: string, currency?: string): string {
  const isINR = symbol === "₹" || currency === "INR";
  const locale = isINR ? "en-IN" : "en-US";

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `${symbol}${formatted}`;
}

