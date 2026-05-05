/**
 * RestDayCard — Educational rest day content with acknowledgment button.
 */

import { useLanguage } from '../../context/LanguageContext';
import { ProgramDay } from '../../types';
import { Moon, Activity, Leaf, Droplets, Bed, CheckCircle2 } from 'lucide-react';

interface RestDayCardProps {
    day: ProgramDay;
    onAcknowledge: () => void;
    isCompleted?: boolean;
}

const REST_TIPS = {
    full_rest: {
        en: [
            'Sleep 7-9 hours tonight — that\'s when muscle repair happens',
            'Eat at your normal calorie/macro targets — recovery needs fuel',
            'Stay hydrated — aim for at least 2.5L of water today',
            'Light stretching or foam rolling if muscles are sore',
            'Avoid heavy cardio — save your energy for tomorrow\'s session',
        ],
        ar: [
            'نم 7-9 ساعات الليلة — هنا يحدث إصلاح العضلات',
            'كل وفق أهدافك الغذائية المعتادة — التعافي يحتاج وقوداً',
            'حافظ على الترطيب — اشرب على الأقل 2.5 لتر ماء اليوم',
            'تمدد خفيف أو استخدم الفوم رولر إذا كانت العضلات مؤلمة',
            'تجنب الكارديو الثقيل — وفر طاقتك لجلسة الغد',
        ],
    },
    active_recovery: {
        en: [
            '20-30 minutes of light movement: walking, cycling, swimming',
            'Focus on mobility work — hips, shoulders, ankles',
            'Foam roll major muscle groups for 10-15 minutes',
            'Light stretching — hold each stretch for 30 seconds',
            'This is NOT a workout — keep intensity very low',
        ],
        ar: [
            '20-30 دقيقة من الحركة الخفيفة: مشي، دراجة، سباحة',
            'ركز على تمارين المرونة — الوركين، الأكتاف، الكاحلين',
            'استخدم الفوم رولر على المجموعات العضلية الرئيسية 10-15 دقيقة',
            'تمدد خفيف — أبقِ كل وضعية لمدة 30 ثانية',
            'هذا ليس تمريناً — حافظ على شدة منخفضة جداً',
        ],
    },
};

const ICONS = [Leaf, Droplets, Bed, Activity, Moon];

export const RestDayCard = ({ day, onAcknowledge, isCompleted }: RestDayCardProps) => {
    const { lang, isRTL } = useLanguage();
    const isAr = lang === 'ar';
    const isActive = day.restDayType === 'active_recovery';
    const tips = isActive ? REST_TIPS.active_recovery : REST_TIPS.full_rest;
    const tipList = isAr ? tips.ar : tips.en;

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
            {/* Header banner */}
            <div className={`rounded-2xl p-6 border ${
                isActive
                    ? 'bg-emerald-500/5 border-emerald-400/20'
                    : 'bg-indigo-500/5 border-indigo-400/20'
            }`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-emerald-500/15' : 'bg-indigo-500/15'
                    }`}>
                        {isActive
                            ? <Activity className="text-emerald-400" size={24} />
                            : <Moon className="text-indigo-400" size={24} />
                        }
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">
                            {isAr
                                ? (isActive ? 'يوم تعافي نشط' : 'يوم راحة')
                                : (isActive ? 'Active Recovery Day' : 'Rest Day')
                            }
                        </h2>
                        <p className={`text-sm ${isActive ? 'text-emerald-400/70' : 'text-indigo-400/70'}`}>
                            {isAr
                                ? `اليوم ${day.dayNumber} من 10`
                                : `Day ${day.dayNumber} of 10`
                            }
                        </p>
                    </div>
                </div>

                <p className="text-on-surface text-sm leading-relaxed">
                    {isAr
                        ? (isActive
                            ? 'التعافي النشط يحسّن تدفق الدم ويسرّع الشفاء. حركة خفيفة فقط — لا تمارين ثقيلة.'
                            : 'الراحة هي حيث يحدث النمو. عضلاتك تُبنى أثناء النوم والتعافي، وليس أثناء التمرين.'
                          )
                        : (isActive
                            ? 'Active recovery improves blood flow and speeds healing. Light movement only — no heavy lifting.'
                            : 'Rest is where growth happens. Your muscles are built during sleep and recovery, not during the workout.'
                          )
                    }
                </p>
            </div>

            {/* Tips list */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold uppercase text-primary tracking-wider">
                    {isAr ? 'نصائح لليوم' : "Today's Tips"}
                </h3>
                <ul className="space-y-3">
                    {tipList.map((tip, i) => {
                        const Icon = ICONS[i % ICONS.length];
                        return (
                            <li key={i} className="flex items-start gap-3">
                                <Icon size={16} className={`mt-0.5 shrink-0 ${
                                    isActive ? 'text-emerald-400/60' : 'text-indigo-400/60'
                                }`} />
                                <span className="text-sm text-on-surface">{tip}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Acknowledge button */}
            {!isCompleted ? (
                <button
                    onClick={onAcknowledge}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                        isActive
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                            : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30'
                    }`}
                >
                    <CheckCircle2 size={22} />
                    {isAr ? 'تم — أنا مرتاح اليوم ✓' : "Done — I'm resting today ✓"}
                </button>
            ) : (
                <div className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 ${
                    isActive
                        ? 'bg-emerald-500/10 text-emerald-400/50'
                        : 'bg-indigo-500/10 text-indigo-400/50'
                }`}>
                    <CheckCircle2 size={22} />
                    {isAr ? 'تم التسجيل ✓' : 'Logged ✓'}
                </div>
            )}
        </div>
    );
};
