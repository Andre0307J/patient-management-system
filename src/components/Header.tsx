import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  isSignUpPage?: boolean;
  isVerificationSentPage?: boolean;
}

export default function Header({ 
  isSignUpPage = false,
  isVerificationSentPage = false
}: HeaderProps) {
  return (
    <header className="w-full px-8 py-4 flex items-center justify-between bg-transparent">
      {/* Logo + App Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center">
          <Image
            src="/pms-image.png"
            alt="PatientCare logo"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-white font-semibold text-xl tracking-wide">
          PatientCare
        </span>
      </div>

      {/* Nav link — swaps between Sign Up and Login */}
      <nav>
        {isSignUpPage || isVerificationSentPage ? (
          <Link
            href="/"
            className="text-white text-sm font-medium border border-white/40 px-4 py-2 rounded-full hover:bg-white/20 transition"
          >
            Login
          </Link>
        ) : (
          <Link
            href="/signup"
            className="text-white text-sm font-medium border border-white/40 px-4 py-2 rounded-full hover:bg-white/20 transition"
          >
            Sign Up
          </Link>
        )}
      </nav>
    </header>
  );
}