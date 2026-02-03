import { Link } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { useAuth } from '../../contexts/AuthContext';

export function Navigation() {
  const { currentUser } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 nav-glass transition-all duration-300">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-white text-black">
            <Icon icon="solar:code-scan-bold" className="text-sm" />
          </div>
          <span className="font-medium tracking-tight text-sm text-white/90">
            GitScout
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-[#888888]">
          <a href="#product" className="hover:text-white transition-colors duration-200">
            Product
          </a>
          <a href="#workflow" className="hover:text-white transition-colors duration-200">
            Methodology
          </a>
          <a href="#faq" className="hover:text-white transition-colors duration-200">
            FAQ
          </a>
          <a href="#pricing" className="hover:text-white transition-colors duration-200">
            Pricing
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <Link
                to="/dashboard"
                className="text-[13px] font-medium text-[#888888] hover:text-white transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
              <Link
                to="/app"
                className="bg-[#EDEDED] hover:bg-white text-black text-[13px] font-medium px-3 py-1.5 rounded transition-colors tracking-tight"
              >
                Start Hiring
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-[13px] font-medium text-[#888888] hover:text-white transition-colors hidden sm:block"
              >
                Log in
              </Link>
              <Link
                to="/app"
                className="bg-[#EDEDED] hover:bg-white text-black text-[13px] font-medium px-3 py-1.5 rounded transition-colors tracking-tight"
              >
                Start Hiring
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
