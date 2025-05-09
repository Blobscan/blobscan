export function getNeighbouringElements<T>(
  arr: T[],
  index: number,
  neighbourhoodSize: number
): T[] {
  const length = arr.length;
  const half = Math.floor(neighbourhoodSize / 2);

  let start = index - half;
  let end = index + half + 1; // `+1` because slice is exclusive at the end

  // Adjust if start is out of bounds
  if (start < 0) {
    end += Math.abs(start);
    start = 0;
  }

  // Adjust if end is out of bounds
  if (end > length) {
    const overshoot = end - length;
    start = Math.max(0, start - overshoot);
    end = length;
  }

  return arr.slice(start, end);
}

export function splitArrayIntoChunks<T>(arr: T[], chunkSize: number): T[][] {
  const result = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize) as T[]);
  }
  return result;
}
