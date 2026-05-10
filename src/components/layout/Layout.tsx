import { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessagesContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
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
    MessageCircle,
    Settings,
    Sun,
    Moon,
    Trophy,
    Utensils,
    type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

/** iOS-style sidebar item: rounded-square icon tile + label, tight rows. */
const SidebarItem = ({ to, icon: Icon, label, end = false, onClick }: { to: string, icon: LucideIcon, label: string, end?: boolean, onClick?: () => void }) => {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) => clsx(
                "flex items-center gap-3 px-2 py-2 rounded-xl transition-colors group",
                isActive
                    ? "bg-primary/10 text-on-surface font-medium"
                    : "text-on-surface-variant hover:bg-surface-container/40 hover:text-on-surface"
            )}
        >
            {({ isActive }) => (
                <>
                    <span
                        className={clsx(
                            "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-colors",
                            isActive
                                ? "bg-primary text-on-primary shadow-[0_2px_8px_rgb(var(--primary)/0.35)]"
                                : "bg-surface-container-high text-on-surface-variant group-hover:bg-surface-container-highest group-hover:text-on-surface"
                        )}
                    >
                        <Icon size={18} strokeWidth={2.2} />
                    </span>
                    <span className="text-[15px] font-medium leading-none">{label}</span>
                </>
            )}
        </NavLink>
    );
};

export const Layout = () => {
    const { user, signOut } = useAuth();
    const { getUnreadCount } = useMessages();
    const { t, lang, setLang, isRTL } = useLanguage();
    const { theme, toggleTheme } = useTheme();
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
        <div className="flex h-screen text-on-surface overflow-hidden bg-surface">
            {/* Hamburger Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={clsx(
                    "fixed top-4 z-50 p-2.5 rounded-xl transition-all duration-200 active:scale-95",
                    sidebarOpen
                        ? "bg-surface border border-outline-variant/30 shadow-none"
                        : "bg-surface-container-low border border-primary/20 shadow-clay-sm"
                )}
                style={{
                    [isRTL ? 'right' : 'left']: '1rem',
                }}
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
                {sidebarOpen ? (
                    <X size={22} className="text-primary" />
                ) : (
                    <Menu size={22} className="text-primary" />
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
                    [isRTL ? 'borderLeft' : 'borderRight']: '1px solid rgb(var(--primary) / 0.15)',
                    background: 'rgb(var(--surface-container-low) / 0.95)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: sidebarOpen ? '8px 0 32px rgba(0,0,0,0.4)' : 'none',
                }}
            >
                <div className={clsx("flex-1 overflow-y-auto min-h-0 px-4", isRTL ? "pr-4" : "pl-4")} style={{ paddingTop: '4.25rem' }}>
                    {/* Wordmark */}
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center font-black text-on-primary text-base gold-gradient shadow-clay-gold">
                            B
                        </div>
                        <h1 className="text-[17px] font-headline font-bold tracking-tight text-on-surface">
                            Biozackteam
                        </h1>
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3 px-2">
                        {t(user.role as any)} · {t('workspace')}
                    </div>

                    <nav className="flex flex-col gap-0.5">
                        <SidebarItem to="/" icon={LayoutDashboard} label={t('navDashboard')} end onClick={closeSidebar} />

                        {isClient && (
                            <SidebarItem to="/checkin" icon={ClipboardCheck} label={t('navCheckIns')} onClick={closeSidebar} />
                        )}

                        {isCoach && (
                            <SidebarItem to="/clients" icon={Users} label={t('navClients')} onClick={closeSidebar} />
                        )}

                        <SidebarItem to="/library" icon={PlaySquare} label={t('navVideoLibrary')} onClick={closeSidebar} />
                        <SidebarItem to="/workouts" icon={Dumbbell} label={t('navWorkouts')} onClick={closeSidebar} />
                        <SidebarItem to="/diets" icon={Utensils} label={t('navDiets')} onClick={closeSidebar} />

                        {(isCoach || isClient) && (
                            <NavLink
                                to="/messages"
                                onClick={closeSidebar}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-2 py-2 rounded-xl transition-colors group",
                                    isActive
                                        ? "bg-primary/10 text-on-surface font-medium"
                                        : "text-on-surface-variant hover:bg-surface-container/40 hover:text-on-surface"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={clsx(
                                            "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-colors",
                                            isActive
                                                ? "bg-primary text-on-primary shadow-[0_2px_8px_rgb(var(--primary)/0.35)]"
                                                : "bg-surface-container-high text-on-surface-variant group-hover:bg-surface-container-highest group-hover:text-on-surface"
                                        )}>
                                            <MessageSquare size={18} strokeWidth={2.2} />
                                        </span>
                                        <span className="flex-1 text-[15px] font-medium leading-none">{t('navMessages')}</span>
                                        {unreadCount > 0 && (
                                            <span className="w-5 h-5 rounded-full gold-gradient text-on-primary-fixed text-[10px] font-bold flex items-center justify-center shadow-clay-gold">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        )}

                        {/* Community → in-app feed. Discord button lives on the /community page itself. */}
                        <SidebarItem to="/community" icon={MessageCircle} label={t('navCommunity')} onClick={closeSidebar} />

                        {isCoach && (
                            <SidebarItem to="/leaderboard" icon={Trophy} label={t('navLeaderboard')} onClick={closeSidebar} />
                        )}
                        <SidebarItem to="/profile" icon={UserCircle} label={t('navProfile')} onClick={closeSidebar} />
                        <SidebarItem to="/settings" icon={Settings} label={t('navSettings')} onClick={closeSidebar} />
                    </nav>
                </div>

                {/* Footer — pinned to the bottom of the viewport so theme toggle + sign out
                    are always reachable. Inner-flex nav above scrolls if it overflows. */}
                <div
                    className="shrink-0 px-4 pt-4 border-t border-outline-variant/20"
                    style={{
                        background: 'rgb(var(--surface-container-lowest) / 0.6)',
                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
                    }}
                >
                    {/* User row */}
                    <div className={clsx("flex items-center gap-3 px-2 py-2 mb-2 rounded-xl", isRTL && "flex-row-reverse")}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full ring-2 ring-primary/20" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant ring-2 ring-primary/20">
                                <UserCircle size={22} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-on-surface truncate leading-tight">{user.name}</p>
                            <p className="text-[11px] text-on-surface-variant truncate leading-tight">{user.email}</p>
                        </div>
                    </div>

                    {/* Lang + theme + sign out — equal-width row, iOS-style tiles */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={toggleLang}
                            aria-label="Switch language"
                            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface bg-surface-container/40 hover:bg-surface-container transition-colors"
                        >
                            <Globe size={16} strokeWidth={2.2} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">{lang === 'en' ? 'AR' : 'EN'}</span>
                        </button>
                        <button
                            onClick={toggleTheme}
                            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-on-surface-variant hover:text-primary bg-surface-container/40 hover:bg-surface-container transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
                            <span className="text-[10px] font-medium uppercase tracking-wider">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            aria-label="Sign out"
                            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-on-surface-variant hover:text-rose-400 bg-surface-container/40 hover:bg-rose-500/10 transition-colors"
                        >
                            <LogOut size={16} strokeWidth={2.2} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">{t('signOut')}</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Background image was previously shown on dark theme. Removed
                    per founder direction: keep only the theme surface color on
                    dark, no scenic backdrop. The dist/ JPEGs (bg-desktop,
                    bg-mobile) are still bundled because the imports remain — if
                    we remove the imports, restore them later by editing both
                    here and at the top of the file. */}
                {/* Light theme: solid surface fill, no image */}
                {theme === 'light' && (
                    <div className="fixed inset-0 z-0" style={{ background: 'rgb(var(--surface))' }} />
                )}
                {/* Subtle gold accent (works on both themes) */}
                <div className="fixed inset-0 pointer-events-none z-[2]"
                    style={{ background: 'radial-gradient(ellipse at top, rgb(var(--primary) / 0.06), transparent 60%)' }} />
                {/* Content */}
                <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto" style={{ paddingTop: '4rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
