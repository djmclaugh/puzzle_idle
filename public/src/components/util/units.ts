const min = 60;
const hour = min * 60;
const day = hour * 24;

const kilo = 1000;
const mega = 1000;

export function secondsToString(seconds: number): string {
  seconds = Math.round(seconds);
  if (seconds < min) {
    return seconds + " s";
  } else if (seconds < 10 * min) {
    return (seconds/min).toFixed(1) + " min"
  } else if (seconds < hour) {
    return (seconds/min).toFixed(0) + " min"
  } else if (seconds < 10 * hour) {
    return (seconds/hour).toFixed(1) + " h"
  } else if (seconds < 86400) {
    return (seconds/hour).toFixed(0) + " h"
  } else if (seconds < 10 * day) {
    return (seconds/day).toFixed(1) + " d"
  } else {
    return (seconds/day).toFixed(0) + " d"
  }
}

export function gramsToString(grams: number): string {
  if (grams < 10) {
    return grams.toFixed(1) + " g";
  } else if (grams < kilo) {
    return grams.toFixed(0) + " g"
  } else if (grams < 10 * kilo) {
    return (grams / kilo).toFixed(1) + " kg"
  } else if (grams < mega) {
    return (grams / kilo).toFixed(0) + " kg"
  } else if (grams < 10 * mega) {
    return (grams / mega).toFixed(1) + " Mg"
  } else {
    return (grams / mega).toFixed(0) + " Mg"
  }
}
