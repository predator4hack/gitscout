import { Icon } from '../shared/Icon';

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 bg-[#030303]">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[#333] text-white">
            <Icon icon="solar:code-scan-bold" className="text-[10px]" width={10} />
          </div>
          <span className="font-medium tracking-tight text-xs text-[#888]">
            GitScout Inc.
          </span>
        </div>

        {/* Links */}
        <div className="flex gap-8 text-[11px] text-[#666] font-medium uppercase tracking-wider">
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Twitter
          </a>
          <a href="#" className="hover:text-white transition-colors">
            GitHub
          </a>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-[#444444]">© 2024</p>
      </div>
    </footer>
  );
}
