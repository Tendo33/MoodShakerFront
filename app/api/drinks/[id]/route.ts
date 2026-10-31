import { authorizeDrink } from "@/lib/authorize";
import { toView } from "@/lib/db/drinks";
import { createRequestId, fail, ok } from "@/lib/http";
import { logger } from "@/lib/log";

/** Reads a private drink. POST, so the edit token travels in the body and never in a URL. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeDrink(request, params);
    if (!auth.ok) return auth.response;
    return ok(toView(auth.row));
  } catch (error) {
    const requestId = createRequestId();
    logger("drink", { requestId }).error("Read failed", { error });
    return fail("INTERNAL", 500, requestId);
  }
}
