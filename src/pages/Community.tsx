import { ExternalLink, MessageCircle, Users, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DISCORD_INVITE = 'https://discord.gg/T5nue8amkm';

export const Community = () => {
    const { t } = useLanguage();
    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 pt-8 pb-20">
            {/* Prominent gold-gradient Discord CTA at top */}
            <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-full font-bold text-lg text-on-primary
                           bg-gradient-to-r from-primary to-primary-container shadow-clay-gold
                           active:scale-[0.98] hover:scale-[1.01] transition-transform"
            >
                <MessageCircle size={22} />
                {t('joinDiscord')}
                <ExternalLink size={16} className="opacity-70" />
            </a>
            <p className="text-on-surface-variant text-sm text-center -mt-4">
                {t('discordDesc')}
            </p>

            {/* Editorial header */}
            <header className="text-center">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-3">{t('membersLoungeEyebrow')}</span>
                <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface mb-4 tracking-tighter">
                    {t('joinTheCommunityHeader')} <span className="text-primary-container">{t('communityWord')}</span>
                </h1>
                <p className="text-on-surface/70 font-body leading-relaxed max-w-md mx-auto">
                    {t('communityIntroBlurb')}
                </p>
            </header>

            {/* Glass CTA Card */}
            <section className="bg-surface-container-low rounded-2xl p-8 text-center space-y-8 ghost-border">
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-surface-container-lowest rounded-xl p-5 flex flex-col items-center gap-3 ghost-border">
                        <Users size={24} className="text-primary" />
                        <span className="text-on-surface font-headline font-bold text-sm">{t('membersWord')}</span>
                        <span className="text-on-surface/50 text-[10px] font-label uppercase tracking-widest">{t('activeCommunityLabel')}</span>
                    </div>
                    <div className="bg-surface-container-lowest rounded-xl p-5 flex flex-col items-center gap-3 ghost-border">
                        <MessageCircle size={24} className="text-primary" />
                        <span className="text-on-surface font-headline font-bold text-sm">{t('channelsWord')}</span>
                        <span className="text-on-surface/50 text-[10px] font-label uppercase tracking-widest">{t('channelsBlurb')}</span>
                    </div>
                    <div className="bg-surface-container-lowest rounded-xl p-5 flex flex-col items-center gap-3 ghost-border">
                        <Zap size={24} className="text-primary" />
                        <span className="text-on-surface font-headline font-bold text-sm">{t('liveWord')}</span>
                        <span className="text-on-surface/50 text-[10px] font-label uppercase tracking-widest">{t('coachEventsLabel')}</span>
                    </div>
                </div>

                <a
                    href={DISCORD_INVITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 w-full justify-center text-on-surface font-bold py-5 px-8 text-sm uppercase tracking-[0.15em] rounded-full shadow-lg active:scale-95 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #5865F2, #404EED)' }}
                >
                    <MessageCircle size={22} />
                    Open Discord
                    <ExternalLink size={16} className="opacity-70" />
                </a>

                <p className="text-on-surface/40 text-[10px] font-label uppercase tracking-widest font-bold">
                    Opens Discord in a new tab · Free to join
                </p>
            </section>
        </div>
    );
};
