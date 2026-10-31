import { authorizeDrink } from "@/lib/authorize";
import { publishDrink, toView, withdrawDrink } from "@/lib/db/drinks";
import { consumeRateLimit } from "@/lib/db/rate-limit";
import { createRequestId, fail, getClientIp, ok, rateLimitHeaders } from "@/lib/http";
import { logger } from "@/lib/log";

type Context = { params: Promise<{ id: string }> };

/** Puts a private drink on the public menu. Limited per IP: the cost is public rows, not compute. */
export async function POST(request: Request, { params }: Context) {
  let requestId = createRequestId();
  try {
    const auth = await authorizeDrink(request, params);
    if (!auth.ok) return auth.response;
    requestId = auth.requestId;

    const limit = await consumeRateLimit(`publish:${getClientIp(request)}`, 10, 60 * 60_000);
    const headers = rateLimitHeaders(limit);
    if (!limit.allowed) return fail("RATE_LIMITED", 429, requestId, headers);

    const slug = await publishDrink(auth.row);
    return ok({ ...toView(auth.row), slug, published: true }, { headers });
  } catch (error) {
    logger("publish", { requestId }).error("Publish failed", { error });
    return fail("INTERNAL", 500, requestId);
  }
}

/** Takes a drink off the public menu. The slug is kept for a later re-publish. */
export async function DELETE(request: Request, { params }: Context) {
  let requestId = createRequestId();
  try {
    const auth = await authorizeDrink(request, params);
    if (!auth.ok) return auth.response;
    requestId = auth.requestId;

    await withdrawDrink(auth.row);
    return ok({ ...toView(auth.row), published: false });
  } catch (error) {
    logger("publish", { requestId }).error("Withdraw failed", { error });
    return fail("INTERNAL", 500, requestId);
  }
}
