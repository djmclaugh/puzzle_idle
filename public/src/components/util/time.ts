const min = 60;
const hour = min * 60;
const day = hour * 24;

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
