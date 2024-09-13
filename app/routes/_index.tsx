import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, redirect } from "@remix-run/react";
import { authCookie } from "~/auth";

export const meta: MetaFunction = () => {
  return [
    { title: "PlaGeA" },
    { name: "description", content: "Plataforma de Gestão de Amostras" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieString = request.headers.get("Cookie");
  const userId = await authCookie.parse(cookieString);
  if (userId) {
    throw redirect("/home");
  }
  return null;
}   

export default function Index() {
  return (
    <div className="h-full flex flex-col items-center pt-20 bg-slate-900">
      <div className="space-y-4 max-w-md text-lg text-slate-300">
        <p>
          Esta é uma plataforma completa, desenvolvida pela Faculdade de Medicina da Universidade Eduardo Mondlane (UEM), com o objetivo de facilitar a gestão de amostras.
        </p>
        <p>Para começar a utilizar a plataforma, basta clicar em “Iniciar sessão”.</p>
      </div>
      <div className="flex w-full justify-evenly max-w-md mt-8 rounded-3xl p-10 bg-slate-800">
        <Link
          to="/login"
          className="text-xl font-medium text-brand-aqua underline"
        >
          Iniciar sessão
        </Link>
      </div>
    </div>
  );
}
