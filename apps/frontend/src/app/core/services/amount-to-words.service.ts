import { Injectable } from '@angular/core';
import type { Currency } from '../../../types';

/**
 * Polish number words configuration.
 */
const ONES = [
  '', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć',
  'sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć',
  'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście',
  'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'
];

const TENS = [
  '', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt',
  'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'
];

const HUNDREDS = [
  '', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset',
  'sześćset', 'siedemset', 'osiemset', 'dziewięćset'
];

/**
 * Polish plural forms for different magnitude groups.
 */
const GROUPS: [string, string, string][] = [
  ['', '', ''],
  ['tysiąc', 'tysiące', 'tysięcy'],
  ['milion', 'miliony', 'milionów'],
  ['miliard', 'miliardy', 'miliardów']
];

/**
 * Currency configuration for words.
 */
const CURRENCY_WORDS: Record<Currency, { main: [string, string, string]; sub: [string, string, string] }> = {
  PLN: {
    main: ['złoty', 'złote', 'złotych'],
    sub: ['grosz', 'grosze', 'groszy']
  },
  EUR: {
    main: ['euro', 'euro', 'euro'],
    sub: ['cent', 'centy', 'centów']
  },
  USD: {
    main: ['dolar', 'dolary', 'dolarów'],
    sub: ['cent', 'centy', 'centów']
  }
};

/**
 * AmountToWordsService - Converts numeric amounts to Polish words.
 *
 * Handles:
 * - Numbers up to billions
 * - Decimal amounts (grosze/centy)
 * - Multiple currencies (PLN, EUR, USD)
 * - Proper Polish grammatical forms
 *
 * @example
 * ```typescript
 * const service = inject(AmountToWordsService);
 * service.convert(1234.56, 'PLN');
 * // => "jeden tysiąc dwieście trzydzieści cztery złote 56/100"
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AmountToWordsService {
  /**
   * Convert amount to Polish words.
   */
  convert(amount: number, currency: Currency = 'PLN'): string {
    if (isNaN(amount) || amount < 0) {
      return '';
    }

    // Round to 2 decimal places
    amount = Math.round(amount * 100) / 100;

    // Split into whole and fractional parts
    const whole = Math.floor(amount);
    const fraction = Math.round((amount - whole) * 100);

    // Convert whole part
    const wholeWords = this.convertWhole(whole);
    const currencyConfig = CURRENCY_WORDS[currency];
    const mainWord = this.getPolishForm(whole, currencyConfig.main);

    // Format result
    if (whole === 0 && fraction === 0) {
      return `zero ${currencyConfig.main[2]}`;
    }

    let result = '';

    if (whole > 0) {
      result = `${wholeWords} ${mainWord}`;
    } else {
      result = `zero ${currencyConfig.main[2]}`;
    }

    // Add fraction
    result += ` ${fraction.toString().padStart(2, '0')}/100`;

    return result;
  }

  /**
   * Convert whole number to words.
   */
  private convertWhole(n: number): string {
    if (n === 0) return 'zero';

    const parts: string[] = [];
    let groupIndex = 0;

    while (n > 0) {
      const group = n % 1000;
      if (group > 0) {
        const groupWords = this.convertGroup(group);
        const groupName = this.getPolishForm(group, GROUPS[groupIndex]);
        if (groupIndex === 0) {
          parts.unshift(groupWords);
        } else {
          parts.unshift(`${groupWords} ${groupName}`);
        }
      }
      n = Math.floor(n / 1000);
      groupIndex++;
    }

    return parts.join(' ').trim();
  }

  /**
   * Convert a three-digit group to words.
   */
  private convertGroup(n: number): string {
    const parts: string[] = [];

    const hundreds = Math.floor(n / 100);
    if (hundreds > 0) {
      parts.push(HUNDREDS[hundreds]);
    }

    const remainder = n % 100;
    if (remainder > 0) {
      if (remainder < 20) {
        parts.push(ONES[remainder]);
      } else {
        const tens = Math.floor(remainder / 10);
        const ones = remainder % 10;
        parts.push(TENS[tens]);
        if (ones > 0) {
          parts.push(ONES[ones]);
        }
      }
    }

    return parts.join(' ');
  }

  /**
   * Get the correct Polish grammatical form based on number.
   *
   * Polish has 3 forms:
   * - Singular (1): "złoty"
   * - Plural 2-4: "złote"
   * - Plural 5+, 0: "złotych"
   */
  private getPolishForm(n: number, forms: [string, string, string]): string {
    const [singular, plural24, plural5] = forms;

    if (n === 1) {
      return singular;
    }

    const lastTwo = n % 100;
    const lastOne = n % 10;

    // 11-19 always use plural5
    if (lastTwo >= 11 && lastTwo <= 19) {
      return plural5;
    }

    // 2, 3, 4 use plural24
    if (lastOne >= 2 && lastOne <= 4) {
      return plural24;
    }

    // Everything else uses plural5
    return plural5;
  }
}
