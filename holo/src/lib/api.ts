export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}
