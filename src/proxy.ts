import { auth } from "@/auth";

export default auth((req) => {
  // Add custom logic here if needed (e.g. logging, strict redirects)
});

export const config = {
  // Matcher ignoring api, static files, images, favicon
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
