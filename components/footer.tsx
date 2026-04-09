import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
        <p className="text-center sm:text-left">
          © {new Date().getFullYear()} PlaGeA - Plataforma de Gestão de Amostras
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex h-10 items-center gap-3">
            <Image
              src="/logo_famed.webp"
              alt="Faculdade de Medicina UEM"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex h-10 items-center gap-3">
            <Image
              src="/logo_fcg.jpeg"
              alt="Fundação Calouste Gulbenkian"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
