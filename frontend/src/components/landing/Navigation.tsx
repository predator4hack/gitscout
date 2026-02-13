import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../shared/Icon";
import { useAuth } from "../../contexts/AuthContext";

export function Navigation() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate("/");
        } catch (error) {
            console.error("Failed to sign out:", error);
        }
    };

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
                    <a
                        href="#product"
                        className="hover:text-white transition-colors duration-200"
                    >
                        Product
                    </a>
                    <a
                        href="#workflow"
                        className="hover:text-white transition-colors duration-200"
                    >
                        Methodology
                    </a>
                    <a
                        href="#faq"
                        className="hover:text-white transition-colors duration-200"
                    >
                        FAQ
                    </a>
                    <a
                        href="#pricing"
                        className="hover:text-white transition-colors duration-200"
                    >
                        Pricing
                    </a>
                </div>

                {/* CTA Buttons */}
                <div className="flex items-center gap-3">
                    {currentUser ? (
                        <>
                            {/* User name */}
                            <Link
                                to="/profile"
                                className="text-[#888888] hover:text-white text-xs hidden sm:inline transition-colors duration-200"
                            >
                                {currentUser.displayName || currentUser.email}
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="text-[#888888] hover:text-white flex items-center gap-1.5 transition-colors duration-200 text-[13px] font-medium"
                            >
                                <Icon
                                    icon="lucide:log-out"
                                    className="w-4 h-4"
                                />
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/auth"
                            className="text-[13px] font-medium text-[#888888] hover:text-white transition-colors"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
