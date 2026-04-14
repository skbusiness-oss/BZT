import { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessagesContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    LayoutDashboard,
    ClipboardCheck,
    PlaySquare,
    Users,
    LogOut,
    UserCircle,
    Dumbbell,
    Globe,
    Menu,
    X,
    MessageSquare,
    ExternalLink,
    Settings
} from 'lucide-react';
import clsx from 'clsx';
import bgDesktop from '../../assets/bg-desktop.jpg';
import bgMobile from '../../assets/bg-mobile.jpg';

const SidebarItem = ({ to, icon: Icon, label, end = false, onClick }: { to: string, icon: React.ComponentType<{ size?: number; className?: string }>, label: string, end?: boolean, onClick?: () => void }) => {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) => clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-gold-500/15 text-gold-400 font-medium shadow-clay-sm"
                    : "text-navy-200 hover:bg-navy-700/40 hover:text-white"
            )}
        >
            <Icon size={20} />
            <span>{label}</span>
        </NavLink>
    );
};

export const Layout = () => {
    const { user, signOut } = useAuth();
    const { getUnreadCount } = useMessages();
    const { t, lang, setLang, isRTL } = useLanguage();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Memoize unread count to prevent double-render recalculation
    const unreadCount = useMemo(
        () => (user ? getUnreadCount(user.id) : 0),
        [getUnreadCount, user]
    );

    const handleLogout = async () => {
        setSidebarOpen(false);
        await signOut();
        navigate('/login');
    };

    const toggleLang = () => {
        setLang(lang === 'en' ? 'ar' : 'en');
    };

    const closeSidebar = () => setSidebarOpen(false);

    if (!user) return null;

    const isCoach = user.role === 'coach' || user.role === 'admin';
    const isClient = user.role === 'client';

    return (
        <div className="flex h-screen text-white overflow-hidden" style={{ background: '#060814' }}>
            {/* Hamburger Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-4 z-50 p-2.5 rounded-xl transition-all duration-200 active:scale-95"
                style={{
                    [isRTL ? 'right' : 'left']: '1rem',
                    background: sidebarOpen
                        ? 'rgba(14, 19, 56, 0.9)'
                        : 'linear-gradient(145deg, rgba(14, 19, 56, 0.8), rgba(6, 8, 20, 0.95))',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '4px 4px 12px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.015)',
                }}
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
                {sidebarOpen ? (
                    <X size={22} className="text-gold-400" />
                ) : (
                    <Menu size={22} className="text-gold-400" />
                )}
            </button>

            {/* Backdrop Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 z-30 transition-opacity duration-300",
                    sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(2px)' }}
                onClick={closeSidebar}
            />

            {/* Sliding Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 z-40 w-72 flex flex-col transition-transform duration-300 ease-in-out",
                    isRTL ? "right-0" : "left-0"
                )}
                style={{
                    transform: sidebarOpen
                        ? 'translateX(0)'
                        : isRTL ? 'translateX(100%)' : 'translateX(-100%)',
                    borderRadius: 0,
                    [isRTL ? 'borderLeft' : 'borderRight']: '1px solid rgba(255,255,255,0.04)',
                    background: 'linear-gradient(180deg, rgba(10,13,36,0.98), rgba(6,8,20,1))',
                    boxShadow: sidebarOpen ? '8px 0 30px rgba(0,0,0,0.5)' : 'none',
                }}
            >
                <div className={clsx("p-6", isRTL ? "pr-6" : "pl-6")} style={{ paddingTop: '4.5rem' }}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-navy-950 text-sm"
                            style={{ background: 'linear-gradient(135deg, #ffd740, #d4a017)' }}>
                            B
                        </div>
                        <h1 className="text-xl font-bold text-gradient-gold">
                            {t('appName')}
                        </h1>
                    </div>

                    <div className="text-[10px] font-semibold text-navy-300 uppercase tracking-[0.15em] mb-4 px-4">
                        {t(user.role as any)} {t('workspace')}
                    </div>

                    <nav className="flex flex-col gap-1">
                        <SidebarItem to="/" icon={LayoutDashboard} label={t('navDashboard')} end onClick={closeSidebar} />

                        {isClient && (
                            <SidebarItem to="/checkin" icon={ClipboardCheck} label={t('navCheckIns')} onClick={closeSidebar} />
                        )}

                        {isCoach && (
                            <SidebarItem to="/clients" icon={Users} label={t('navClients')} onClick={closeSidebar} />
                        )}

                        <SidebarItem to="/library" icon={PlaySquare} label={t('navVideoLibrary')} onClick={closeSidebar} />
                        <SidebarItem to="/workouts" icon={Dumbbell} label={t('navWorkouts')} onClick={closeSidebar} />

                        {(isCoach || isClient) && (
                            <NavLink
                                to="/messages"
                                onClick={closeSidebar}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-gold-500/15 text-gold-400 font-medium shadow-clay-sm"
                                        : "text-navy-200 hover:bg-navy-700/40 hover:text-white"
                                )}
                            >
                                <MessageSquare size={20} />
                                <span className="flex-1">Messages</span>
                                {unreadCount > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-gold-500 text-navy-950 text-xs font-bold flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </NavLink>
                        )}

                        {/* Community → Discord external link */}
                        <a
                            href="https://discord.gg/biozackteam"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={closeSidebar}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-navy-200 hover:bg-navy-700/40 hover:text-white"
                        >
                            <ExternalLink size={20} />
                            <span className="flex-1">Community</span>
                            <ExternalLink size={12} className="opacity-40" />
                        </a>

                        <SidebarItem to="/profile" icon={UserCircle} label={t('navProfile')} onClick={closeSidebar} />
                        <SidebarItem to="/settings" icon={Settings} label="Settings" onClick={closeSidebar} />
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-white/[0.04]">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLang}
                        className="flex items-center gap-2 w-full px-3 py-2 mb-4 rounded-lg text-sm text-navy-200 hover:text-white hover:bg-navy-700/40 transition-colors"
                    >
                        <Globe size={16} />
                        <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                    </button>

                    <div className={clsx("flex items-center gap-3 mb-4", isRTL && "flex-row-reverse")}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border border-gold-500/20" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-navy-300">
                                <UserCircle size={24} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-navy-300 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-navy-300 hover:text-rose-400 transition-colors w-full px-2"
                    >
                        <LogOut size={16} />
                        {t('signOut')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Background Image - Desktop */}
                <div
                    className="hidden md:block fixed inset-0 z-0"
                    style={{
                        backgroundImage: `url(${bgDesktop})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                {/* Background Image - Mobile */}
                <div
                    className="md:hidden fixed inset-0 z-0"
                    style={{
                        backgroundImage: `url(${bgMobile})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                {/* Dark overlay for readability */}
                <div className="fixed inset-0 z-[1]" style={{ background: 'rgba(6, 8, 20, 0.80)' }} />
                {/* Subtle gradient accent */}
                <div className="fixed inset-0 pointer-events-none z-[2]"
                    style={{ background: 'radial-gradient(ellipse at top, rgba(14,19,56,0.2), transparent 60%)' }} />
                {/* Content */}
                <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto" style={{ paddingTop: '4rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
