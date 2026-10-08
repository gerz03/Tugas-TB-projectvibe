import { handleError, ok } from "@/lib/api";
import { syncExternalFootballData } from "@/lib/football-api";

import { requireAdminApiKey } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const authorizationError = requireAdminApiKey(request);
  if (authorizationError) return authorizationError;
  try {
    return ok(await syncExternalFootballData());
  } catch (error) {
    return handleError(error);
  }
}
