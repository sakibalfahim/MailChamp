import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(ar|bn|en|es|fr|ru|zh)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
