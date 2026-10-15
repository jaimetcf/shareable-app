import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

function handler(request: Request) {
  const methods = toNextJsHandler(getAuth());
  const method = request.method as keyof typeof methods;
  const respond = methods[method];
  if (!respond) return new Response(null, { status: 405 });
  return respond(request);
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
