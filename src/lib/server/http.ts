// Small helpers so route handlers stay thin and consistent.

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function bad(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
