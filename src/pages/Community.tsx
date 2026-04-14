import { ExternalLink, MessageCircle, Users, Zap } from 'lucide-react';

const DISCORD_INVITE = 'https://discord.gg/biozackteam';

export const Community = () => {
    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 pt-8">
            {/* Header */}
            <div className="text-center">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #5865F2, #404EED)' }}>
                    <MessageCircle size={36} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Join the Community</h1>
                <p className="text-navy-200">
                    Connect with fellow members, share your progress, ask questions,
                    and get support — all on Discord.
                </p>
            </div>

            {/* Discord CTA Card */}
            <div className="clay-card p-8 text-center space-y-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="clay-card-sm p-4 flex flex-col items-center gap-2">
                        <Users size={22} className="text-gold-400" />
                        <span className="text-white font-medium">Members</span>
                        <span className="text-navy-300 text-xs">Active community</span>
                    </div>
                    <div className="clay-card-sm p-4 flex flex-col items-center gap-2">
                        <MessageCircle size={22} className="text-gold-400" />
                        <span className="text-white font-medium">Channels</span>
                        <span className="text-navy-300 text-xs">Tips, wins, Q&amp;A</span>
                    </div>
                    <div className="clay-card-sm p-4 flex flex-col items-center gap-2">
                        <Zap size={22} className="text-gold-400" />
                        <span className="text-white font-medium">Live</span>
                        <span className="text-navy-300 text-xs">Coach events</span>
                    </div>
                </div>

                <a
                    href={DISCORD_INVITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 w-full justify-center clay-button text-white font-bold py-4 px-8 text-lg transition-transform active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #5865F2, #404EED)' }}
                >
                    <MessageCircle size={22} />
                    Open Discord
                    <ExternalLink size={16} className="opacity-70" />
                </a>

                <p className="text-navy-400 text-xs">
                    Opens Discord in a new tab. Free to join.
                </p>
            </div>
        </div>
    );
};
