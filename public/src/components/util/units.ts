const min = 60;
const hour = min * 60;
const day = hour * 24;
const year = day * 365;

const kilo = 1000;
const mega = 1000 * kilo;
const giga = 1000 * mega;
const tera = 1000 * giga;
const peta = 1000 * tera;

const k = 1000;
const m = 1000 * k;
const b = 1000 * m;
const t = 1000 * b;
const q = 1000 * t;

export function moneyToString(value: number): string {
  if (value < k) {
    return `$${value}`;
  } else if (value < m) {
    return `$${(value/k).toFixed(2)}K`;
  } else if (value < b) {
    return `$${(value/m).toFixed(2)}M`;
  } else if (value < t) {
    return `$${(value/b).toFixed(2)}B`;
  } else if (value < q) {
    return `$${(value/t).toFixed(2)}T`;
  } else {
    return `$${(value/q).toFixed(2)}Qa`;
  }
}

export function metricToString(value: number, baseUnit: string): string {
  if (value < kilo) {
    return `${value.toFixed(2)} ${baseUnit}`;
  } else if (value < mega) {
    return `${(value/kilo).toFixed(2)} k${baseUnit}`;
  } else if (value < giga) {
    return `${(value/mega).toFixed(2)} M${baseUnit}`;
  } else if (value < tera) {
    return `${(value/giga).toFixed(2)} G${baseUnit}`;
  } else if (value < peta) {
    return `${(value/tera).toFixed(2)} T${baseUnit}`;
  } else {
    return `${(value/peta).toFixed(2)} P${baseUnit}`;
  }
}

export function secondsToString(seconds: number): string {
  seconds = Math.floor(seconds);
  if (seconds < min) {
    return seconds.toFixed(0) + " s";
  } else if (seconds < hour) {
    const numberOfSeconds =  seconds % min;
    const numberOfMinuts = (seconds - numberOfSeconds) / min
    return `${numberOfMinuts} min ${numberOfSeconds} s`;
  } else if (seconds < day) {
    const numberOfMinutes =  Math.floor((seconds % hour) / min);
    const numberOfHours = Math.floor(seconds / hour);
    return `${numberOfHours} h ${numberOfMinutes} min`;
  } else if (seconds < year) {
    const numberOfHours =  Math.floor((seconds % day) / hour);
    const numberOfDays = Math.floor(seconds / day);
    return `${numberOfDays} d ${numberOfHours} h`;
  } else {
    const numberOfDays =  Math.floor((seconds % year) / day);
    const numberOfYears = Math.floor(seconds / year);
    return `${numberOfYears} y ${numberOfDays} d`;
  }
}

export function gramsToString(grams: number): string {
  return metricToString(grams, "g");
}
