import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in", "/sign-up", "/api/dpa"]);

export default clerkMiddleware(async (auth, request) => {
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
