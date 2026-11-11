import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const THEME_INIT = "try{var t=localStorage.getItem('theme');if(t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')}catch(e){}";
const SW_REGISTER = "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CitationLX" },
      { name: "description", content: "Dataset citation repair for researchers." },
      { name: "theme-color", content: "#1d1d26" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Space+Grotesk:wght@500;600;700&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAQK0lEQVR4AQEgEN/vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAUgEBAVjxgYH88dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8YGB/PEBAVjwQEBSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsLDmAbGyTvHR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/xsbJO8LCw5gAAAAAAAAAAAAAAAAAAAAAAAAAAAACwsOYB0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/CwsOYAAAAAAAAAAAAAAAAAAEBAUgGxsk7x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/Gxsk7wQEBSAAAAAAAAAAAAAQEBWPHR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/xAQFY8AAAAAAAAAAAAYGB/PHR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/xgYH88AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8zKSn/a0Yv/3dMMP9VOiz/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/Py4q/3dMMP93TDD/Py4q/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/2BALv/Qejr/0Ho6/9B6Ov/Qejr/rmk2/ygjJ/8dHSb/HR0m/x0dJv+NVzP/0Ho6/9B6Ov/Qejr/0Ho6/41XM/8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/SjQr/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/6NjNf8dHSb/HR0m/3dMMP/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov93TDD/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/jVcz/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov8zKSn/HR0m/7puOP/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov+6bjj/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/o2M1/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov9KNCv/HR0m/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/jVcz/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov8zKSn/HR0m/7puOP/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov+6bjj/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/SjQr/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/6NjNf8dHSb/HR0m/3dMMP/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov93TDD/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/Mykp/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/rmk2/ygjJ/8dHSb/HR0m/2BALv/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/41XM/8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/SjQr/9B6Ov/Qejr/0Ho6/9B6Ov9rRi//HR0m/x0dJv8dHSb/HR0m/3dMMP/Qejr/0Ho6/9B6Ov/FdDn/SjQr/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/a0Yv/9B6Ov/Qejr/0Ho6/41XM/8dHSb/HR0m/x0dJv8dHSb/HR0m/5hdNP/Qejr/0Ho6/9B6Ov9gQC7/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/d0ww/9B6Ov/Qejr/rmk2/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/6NjNf/Qejr/0Ho6/4JRMf8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/o2M1/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov9KNCv/HR0m/9B6Ov/Qejr/0Ho6/9B6Ov/Qejr/0Ho6/9B6Ov+6bjj/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/rmk2/8V0Of8/Lir/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/KCMn/9B6Ov+uaTb/KCMn/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/0Ho6/2BALv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/SjQr/8V0Of8/Lir/HR0m/x0dJv9ta23/5eDY/+Xg2P9ta23/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8zKSn/glEx/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/YEAu/1U6LP8dHSb/HR0m/x0dJv/l4Nj/8u3k//Lt5P/l4Nj/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8oIyf/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/KCMn/x0dJv8dHSb/HR0m/x0dJv/l4Nj/8u3k//Lt5P/l4Nj/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAdHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv9ta23/5eDY/+Xg2P9ta23/HR0m/x0dJv8dHSb/HR0m/x0dJv8AAAAAAAAAAAAYGB/PHR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/xAQFY8AAAAAAAAAAAAEBAUgGxsk7x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/Gxsk7wQEBSAAAAAAAAAAAAAAAAAACwsOYB0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/CwsOYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsLDmAbGyTvHR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/HR0m/x0dJv8dHSb/Gxsk7wQEBSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsZVXudUjT8AAAAASUVORK5CYII=", type: "image/png", sizes: "32x32" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <HeadContent />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-J1ZK9TP8L5" />
        <script dangerouslySetInnerHTML={{ __html: "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J1ZK9TP8L5');" }} />
      </head>
      <body>
        {children}
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER }} />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

