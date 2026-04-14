import { useState } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const AdminSetup = () => {
    const { user, createUserAccount } = useAuth();
    const [log, setLog] = useState<string[]>([]);
    
    const [coachName, setCoachName] = useState('');
    const [coachEmail, setCoachEmail] = useState('');
    const [coachPassword, setCoachPassword] = useState('');
    const [isCreatingCoach, setIsCreatingCoach] = useState(false);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const handleCreateCoach = async () => {
        if (!coachName || !coachEmail || !coachPassword) {
            addLog('❌ Please fill in all coach details');
            return;
        }

        setIsCreatingCoach(true);
        try {
            const result = await createUserAccount(coachEmail, coachPassword, coachName, 'coach');
            if (result.error) {
                addLog(`❌ Error: ${result.error}`);
            } else {
                addLog(`✅ Coach account created successfully!`);
                setCoachName('');
                setCoachEmail('');
                setCoachPassword('');
            }
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        } finally {
            setIsCreatingCoach(false);
        }
    };

    const seedVideos = async () => {
        try {
            const videos = [
                { title: 'Nutrition Fundamentals', category: 'Nutrition', thumbnailUrl: 'https://placehold.co/600x400/10b981/ffffff?text=Nutrition', isLocked: false, description: 'Master the fundamentals of nutrition.', videoUrl: '', platform: 'youtube' },
                { title: 'Progressive Overload', category: 'Training', thumbnailUrl: 'https://placehold.co/600x400/3b82f6/ffffff?text=Training', isLocked: false, description: 'Learn progressive overload for gains.', videoUrl: '', platform: 'youtube' },
                { title: 'Advanced Macro Cycling', category: 'Nutrition', thumbnailUrl: 'https://placehold.co/600x400/8b5cf6/ffffff?text=Advanced', isLocked: true, description: 'Advanced carb cycling techniques.', videoUrl: '', platform: 'vimeo' },
                { title: 'Coaching Secrets', category: 'Coaching', thumbnailUrl: 'https://placehold.co/600x400/f43f5e/ffffff?text=Secrets', isLocked: true, description: 'Insider tips from top coaches.', videoUrl: '', platform: 'youtube' },
            ];
            for (const v of videos) {
                await addDoc(collection(db, 'courses'), { ...v, createdAt: serverTimestamp() });
            }
            addLog(`✅ ${videos.length} sample videos created`);
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        }
    };

    const seedCategories = async () => {
        try {
            await setDoc(doc(db, 'settings', 'videoCategories'), {
                categories: ['Nutrition', 'Training', 'Coaching', 'Mindset', 'Recovery'],
            });
            await setDoc(doc(db, 'settings', 'workoutCategories'), {
                categories: [
                    'Full Body', 'Upper / Lower', 'Push / Pull / Legs',
                    'Bro Split', 'Powerlifting', 'HIIT / Circuit', 'Cardio-Focused',
                ],
            });
            addLog('✅ Video + Workout categories seeded');
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        }
    };

    const seedWelcomePost = async () => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'posts'), {
                authorId: user.id,
                authorName: user.name,
                authorRole: user.role,
                content: '💪 Welcome to BioZackTeam! Share wins, ask questions, and support each other.',
                timestamp: serverTimestamp(),
                likes: [],
                commentCount: 0,
            });
            addLog('✅ Welcome post created');
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8 space-y-8 pb-20 fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">🛠 Platform Setup</h1>
                <p className="text-navy-200">As the platform Admin, use this page to set up the system.</p>
            </div>

            <div className="clay-card p-6 border-l-4 border-gold-500">
                <h2 className="text-xl font-bold text-white mb-4">1. Create Coach Account</h2>
                <p className="text-sm text-navy-200 mb-6">Create the account for Mohammed Zaki to log in and manage clients.</p>
                
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm text-navy-300 mb-1">Coach Name</label>
                        <input
                            type="text"
                            value={coachName}
                            onChange={e => setCoachName(e.target.value)}
                            placeholder="e.g. Mohammed Zaki"
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-navy-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={coachEmail}
                            onChange={e => setCoachEmail(e.target.value)}
                            placeholder="coach@example.com"
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-navy-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={coachPassword}
                            onChange={e => setCoachPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <button
                        onClick={handleCreateCoach}
                        disabled={isCreatingCoach || !coachName || !coachEmail || !coachPassword}
                        className="w-full clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 py-3 mt-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreatingCoach ? 'Creating...' : 'Create Coach Account'}
                    </button>
                </div>
            </div>

            <div className="clay-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">2. Seed System Content</h2>
                <p className="text-sm text-navy-200 mb-6">Initialize required database configurations and samples.</p>
                
                <div className="flex flex-wrap gap-4">
                    <button onClick={seedCategories} className="clay-button bg-navy-700 hover:bg-navy-600 text-white px-6 py-3">
                        Seed Categories
                    </button>
                    <button onClick={seedVideos} className="clay-button bg-navy-700 hover:bg-navy-600 text-white px-6 py-3">
                        Seed Sample Videos
                    </button>
                    <button onClick={seedWelcomePost} className="clay-button bg-navy-700 hover:bg-navy-600 text-white px-6 py-3">
                        Seed Welcome Post
                    </button>
                </div>
            </div>

            {log.length > 0 && (
                <div className="clay-card p-6 bg-navy-900/50">
                    <h3 className="text-white font-bold mb-4">Execution Log</h3>
                    <div className="space-y-2 font-mono text-sm bg-navy-950 p-4 rounded-xl border border-white/5">
                        {log.map((l, i) => (
                            <p key={i} className={l.includes('❌') ? 'text-red-400' : 'text-emerald-400'}>{l}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
