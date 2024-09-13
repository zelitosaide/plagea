import { Link } from "@remix-run/react";
import { LoginIcon, LogoutIcon } from "~/icons/icons";

export default function Header({ userId }: { userId: number | null }) {
  return (
    <div className="bg-slate-900 border-b border-slate-800 flex items-center justify-between py-4 px-8 box-border">
      <Link to="/home" className="block leading-3 w-1/3">
        <div className="font-black text-2xl text-white">PlaGeA</div>
        <div className="text-slate-500">Plataforma de Gestão de Amostras</div>
      </Link>
      <div className="flex items-center gap-6">
        {/*  */}
      </div>
      <div className="w-1/3 flex justify-end">
        {userId ? (
          <form method="post" action="/logout">
            <button className="block text-center">
              <LogoutIcon />
              <br />
              <span className="text-slate-500 text-xs uppercase font-bold">
                Log out
              </span>
            </button>
          </form>
        ) : (
          <Link to="/login" className="block text-center">
            <LoginIcon />
            <br />
            <span className="text-slate-500 text-xs uppercase font-bold">
              Log in
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

function IconLink({
  icon,
  href,
  label,
}: {
  icon: string;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="text-slate-500 text-xs uppercase font-bold text-center"
    >
      <img src={icon} aria-hidden className="inline-block h-8" />
      <span className="block mt-2">{label}</span>
    </a>
  );
}