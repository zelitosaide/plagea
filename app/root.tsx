import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import "./tailwind.css";
import Header from "./components/header";
import { LoaderFunctionArgs } from "@remix-run/node";
import { authCookie } from "./auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieString = request.headers.get("Cookie");
  const userId = await authCookie.parse(cookieString);
  return { userId };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { userId } = useLoaderData<typeof loader>();
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-screen bg-slate-100 text-slate-900">
        <div className="h-full flex flex-col min-h-0">
          <Header userId={userId} />
          <div className="flex-grow min-h-0 h-full">
            {children}
          </div>
        </div>

        <ScrollRestoration />
        <LiveReload />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
