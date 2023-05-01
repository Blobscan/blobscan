export function capitalize(str: string): string {
  if (!str.length) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}
