
/**
 * Converts a number into words.
 * Handles both Million/Billion (Standard) and Lakh/Crore (Indian) formats based on currency.
 */
export function numberToWords(num: number, currency: string = 'INR'): string {
  if (num === 0) return 'Zero';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    return '';
  };

  const formatStandard = (n: number): string => {
    if (n === 0) return '';
    if (n < 1000) return convert(n);
    if (n < 1000000) return formatStandard(Math.floor(n / 1000)) + ' Thousand ' + formatStandard(n % 1000);
    if (n < 1000000000) return formatStandard(Math.floor(n / 1000000)) + ' Million ' + formatStandard(n % 1000000);
    return formatStandard(Math.floor(n / 1000000000)) + ' Billion ' + formatStandard(n % 1000000000);
  };

  const formatIndian = (n: number): string => {
    if (n === 0) return '';
    if (n < 1000) return convert(n);
    if (n < 100000) return formatIndian(Math.floor(n / 1000)) + ' Thousand ' + formatIndian(n % 1000);
    if (n < 10000000) return formatIndian(Math.floor(n / 100000)) + ' Lakh ' + formatIndian(n % 100000);
    return formatIndian(Math.floor(n / 10000000)) + ' Crore ' + formatIndian(n % 10000000);
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = currency === 'INR' ? formatIndian(integerPart) : formatStandard(integerPart);
  result = result.trim() + ' Only';

  if (decimalPart > 0) {
    const decimalWords = currency === 'INR' ? formatIndian(decimalPart) : formatStandard(decimalPart);
    result = result.replace(' Only', '') + ' and ' + decimalWords.trim() + ' Paise Only';
  }

  return result;
}

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
