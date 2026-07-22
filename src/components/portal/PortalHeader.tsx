import Link from "next/link";

interface PortalHeaderProps {
  isSignUpPage?: boolean;
}

export default function PortalHeader({ isSignUpPage = false }: PortalHeaderProps) {
  return (
    <header className="w-full px-8 py-4 flex items-center justify-between bg-transparent">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <div>
          <span className="text-white font-semibold text-xl tracking-wide">
            PatientCare
          </span>
          <span className="text-white/60 text-xs ml-2">Clinical Portal</span>
        </div>
      </div>
      <nav>
        {isSignUpPage ? (
          <Link
            href="/portal"
            className="text-white text-sm font-medium border border-white/40 px-4 py-2 rounded-full hover:bg-white/20 transition"
          >
            Sign In
          </Link>
        ) : (
          <Link
            href="/portal/signup"
            className="text-white text-sm font-medium border border-white/40 px-4 py-2 rounded-full hover:bg-white/20 transition"
          >
            Sign Up
          </Link>
        )}
      </nav>
    </header>
  );
}