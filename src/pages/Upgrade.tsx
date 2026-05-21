/**
 * Upgrade — dedicated page for the inline coaching offer.
 *
 * Reuses the same `<UpgradeOffer />` component that mounts on the
 * Profile page so the pitch + copy stay in one place. The reason for
 * a standalone route (rather than just linking sidebar Upgrade →
 * /update) is that React Router's <NavLink> auto-highlights every
 * link whose `to` prop matches the current pathname. With both
 * Update and Upgrade pointing at /update the user saw BOTH sidebar
 * items lit up at once — confusing and visually noisy.
 *
 * Giving Upgrade its own /upgrade path means:
 *   - The two sidebar items each highlight independently.
 *   - The Upgrade entry feels like its own destination (focused on
 *     the offer) rather than a side-effect of Profile.
 *   - The same UpgradeOffer renders inline on Profile too, so a
 *     community user browsing their account still discovers the
 *     pitch naturally.
 *
 * Non-community users who hit /upgrade by accident (e.g. a coach
 * paste-following a link) see nothing because the UpgradeOffer
 * component is a no-op for non-community roles.
 */
import { useAuth } from '../context/AuthContext';
import { UpgradeOffer } from '../components/profile/UpgradeOffer';
import { useLanguage } from '../context/LanguageContext';

export const Upgrade = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20">
            <header className="mb-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                    {t('navUpgrade')}
                </span>
                <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                    {t('upgradeOfferTitle')}
                </h1>
            </header>

            <UpgradeOffer />
        </div>
    );
};
