export function setQuery(params: Record<string, unknown>) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') url.searchParams.delete(k);
    else url.searchParams.set(k, String(v));
  });
  window.history.replaceState({}, '', url);
}

export function getQuery<T extends string = string>(key: T) {
  return new URLSearchParams(window.location.search).get(key);
}