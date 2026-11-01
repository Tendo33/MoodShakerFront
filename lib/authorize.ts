import "server-only";

import { getOwnedDrink } from "@/lib/db/drinks";
import type { DrinkRow } from "@/lib/db/schema";
import { accessSchema } from "@/lib/domain/order";
import { createRequestId, fail, isSameOrigin, readJson } from "@/lib/http";

/**
 * Shared front half of every route that acts on a private drink: same-origin
 * check, edit token from the body, ownership. An unknown id and a wrong token
 * both return 404 so the route cannot be used to probe for ids.
 */
export async function authorizeDrink(
  request: Request,
  params: Promise<{ id: string }>,
): Promise<{ ok: true; row: DrinkRow; requestId: string } | { ok: false; response: Response }> {
  const requestId = createRequestId();

  if (!isSameOrigin(request)) {
    return { ok: false, response: fail("FORBIDDEN_ORIGIN", 403, requestId) };
  }

  const parsed = accessSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return { ok: false, response: fail("INVALID_PAYLOAD", 400, requestId) };
  }

  const { id } = await params;
  const row = await getOwnedDrink(id, parsed.data.editToken);
  if (!row) {
    return { ok: false, response: fail("NOT_FOUND", 404, requestId) };
  }

  return { ok: true, row, requestId };
}
