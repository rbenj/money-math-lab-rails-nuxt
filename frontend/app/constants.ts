export const APP_VERSION = "0.0.1 Alpha";
export const DEFAULT_BIRTH_DAY = 1;
export const DEFAULT_BIRTH_MONTH = 1;
export const DEFAULT_BIRTH_YEAR = 1990;
export const DEFAULT_RETIREMENT_AGE = 65;
export const SLOW_LOADING_DELAY = 600;

export const DEFAULT_BIRTH_DATE = `${DEFAULT_BIRTH_YEAR}-${DEFAULT_BIRTH_MONTH}-${DEFAULT_BIRTH_DAY}`;

export const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const BIRTH_YEARS = Array.from(
  { length: 100 },
  (_, i) => new Date().getFullYear() - i,
).reverse();
