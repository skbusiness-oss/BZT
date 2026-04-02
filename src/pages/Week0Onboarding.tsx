import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Camera, CheckCircle2 } from 'lucide-react';

export const Week0Onboarding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { clients, completeOnboarding } = useData();

    const [formData, setFormData] = useState({
        startingWeight: '',
        height: '',
        goal: 'fat_loss',
        activityLevel: 'sedentary',
        dietHistory: '',
        injuries: ''
    });

    const handleSubmit = () => {
        if (user) {
            const client = clients.find(c => c.userId === user.id);
            if (client) {
                completeOnboarding(client.id, formData);
                navigate('/');
            } else {
                console.error("Client record not found for user", user.id);
            }
        }
    };

    const goals = [
        { id: 'fat_loss', label: 'Fat Loss', desc: 'Shed body fat while maintaining muscle.' },
        { id: 'muscle_gain', label: 'Muscle Gain', desc: 'Build lean muscle mass in a surplus.' },
        { id: 'recomp', label: 'Recomposition', desc: 'Lose fat and build muscle simultaneously.' },
        { id: 'performance', label: 'Performance', desc: 'Focus on strength and athletic ability.' }
    ];

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Week 0 Intake Form</h1>
                <p className="text-slate-400">Please complete this form to help your coach build your program.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8">

                {/* Weight & Height */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Base Measurements</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Weight (kg)</label>
                            <input
                                type="number"
                                value={formData.startingWeight}
                                onChange={e => setFormData({ ...formData, startingWeight: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-lg focus:border-emerald-500 focus:outline-none"
                                placeholder="e.g. 75"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Height (cm)</label>
                            <input
                                type="number"
                                value={formData.height}
                                onChange={e => setFormData({ ...formData, height: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-lg focus:border-emerald-500 focus:outline-none"
                                placeholder="e.g. 175"
                            />
                        </div>
                    </div>
                </section>

                {/* Physique Documentation */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Physique Documentation</h2>
                    <p className="text-slate-500 text-sm">Upload front, side, and back photos in good lighting.</p>
                    <div className="grid grid-cols-3 gap-4">
                        {['Front', 'Side', 'Back'].map(angle => (
                            <label
                                key={angle}
                                className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-emerald-500/50 hover:bg-slate-800/30 transition-all cursor-pointer group"
                            >
                                <Camera size={28} className="group-hover:text-emerald-500 transition-colors" />
                                <span className="text-sm font-medium">{angle}</span>
                                <span className="text-xs text-slate-600">No file chosen</span>
                                <input type="file" className="hidden" accept="image/*" />
                            </label>
                        ))}
                    </div>
                </section>

                {/* Current Nutrition */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Current Nutrition</h2>
                    <textarea
                        value={formData.dietHistory}
                        onChange={e => setFormData({ ...formData, dietHistory: e.target.value })}
                        placeholder="Describe your current eating habits, any diets you've tried, or supplements you take..."
                        className="w-full h-28 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                </section>

                {/* Primary Objectives */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Primary Objectives</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {goals.map(goal => (
                            <button
                                key={goal.id}
                                onClick={() => setFormData({ ...formData, goal: goal.id })}
                                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${formData.goal === goal.id
                                    ? "bg-emerald-500/10 border-emerald-500"
                                    : "bg-slate-950 border-slate-700 hover:border-slate-600"
                                    }`}
                            >
                                <div>
                                    <div className={`font-bold ${formData.goal === goal.id ? "text-emerald-400" : "text-white"}`}>{goal.label}</div>
                                    <div className="text-xs text-slate-500">{goal.desc}</div>
                                </div>
                                {formData.goal === goal.id && <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Submit */}
                <div className="pt-6 border-t border-slate-800">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                    >
                        <CheckCircle2 size={22} /> Submit Intake Form
                    </button>
                    <p className="text-center text-sm text-slate-500 mt-4">
                        Your coach will review this and build your Week 1 plan.
                    </p>
                </div>

            </div>
        </div>
    );
};
