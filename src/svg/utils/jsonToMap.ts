export function jsonToMap(jsonObj: Object) {
  return new Map<string, string>(Object.entries(jsonObj))
}
