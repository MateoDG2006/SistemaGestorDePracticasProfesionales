/** Tipos minimos de Temporal.PlainDate (runtime Node >= 22 / 26). */
declare namespace Temporal {
  class PlainDate {
    static from(item: string | { year: number; month: number; day: number }): PlainDate;
    static compare(one: PlainDate, two: PlainDate): number;
    readonly year: number;
    readonly month: number;
    readonly day: number;
    add(duration: { years?: number; months?: number; weeks?: number; days?: number }): PlainDate;
    subtract(duration: { years?: number; months?: number; weeks?: number; days?: number }): PlainDate;
    toString(): string;
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;
  }

  const Now: {
    plainDateISO(timeZone?: string): PlainDate;
  };
}
