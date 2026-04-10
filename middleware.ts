import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in", "/sign-up"]);

export default clerkMiddleware(async (auth, request) => {
  // Skip auth checks when running locally — enables manual testing without Clerk
  const host = request.headers.get("host") ?? "";
  const isLocalhost =
    host.includes("localhost") || host.includes("127.0.0.1");

  if (isLocalhost) {
    return;
  }

  if (!isPublicRoute(request)) {
    const authObject = await auth();
    if (!authObject.userId) {
      return authObject.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\w]+$|_next).)", "/", "/(api|trpc)(.*)"],
};
