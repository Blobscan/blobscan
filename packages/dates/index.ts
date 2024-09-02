// Adapted from: https://github.com/ethersphere/bee-dashboard/blob/master/src/utils/index.ts#L175
export function formatTtl(seconds: number) {
  if (seconds < 120) {
    return `${seconds} seconds`;
  }
  seconds /= 60;

  if (seconds < 120) {
    return `${Math.round(seconds)} minutes`;
  }
  seconds /= 60;

  if (seconds < 48) {
    return `${Math.round(seconds)} hours`;
  }
  seconds /= 24;

  if (seconds < 14) {
    return `${Math.round(seconds)} days`;
  }
  seconds /= 7;

  if (seconds < 52) {
    return `${Math.round(seconds)} weeks`;
  }
  seconds /= 52;

  return `${seconds.toFixed(1)} years`;
}
