/**
 * PhoneInput — country-code dropdown + local-number text input.
 *
 * Storage shape: a single e.164-style string ("+212612345678") emitted
 * via onChange. Callers store it on users/{uid}.phone (and on the
 * clients doc for coaching intake) so coaches can WhatsApp / call
 * directly later.
 *
 * Country list is MENA + GCC heavy because that's the audience; a
 * handful of common Western codes are included for diaspora users.
 * Add more by appending to COUNTRIES — no schema migration needed.
 */
import { useMemo } from 'react';
import { Phone } from 'lucide-react';

interface Country {
    code: string;        // e.g. "+212"
    iso: string;         // ISO 3166-1 alpha-2 (used for flag emoji)
    nameEn: string;
    nameAr: string;
}

// Sorted: home market first (Morocco), then GCC/MENA, then Western diaspora.
const COUNTRIES: Country[] = [
    { code: '+212', iso: 'MA', nameEn: 'Morocco',       nameAr: 'المغرب' },
    { code: '+966', iso: 'SA', nameEn: 'Saudi Arabia',  nameAr: 'السعودية' },
    { code: '+971', iso: 'AE', nameEn: 'UAE',           nameAr: 'الإمارات' },
    { code: '+974', iso: 'QA', nameEn: 'Qatar',         nameAr: 'قطر' },
    { code: '+965', iso: 'KW', nameEn: 'Kuwait',        nameAr: 'الكويت' },
    { code: '+973', iso: 'BH', nameEn: 'Bahrain',       nameAr: 'البحرين' },
    { code: '+968', iso: 'OM', nameEn: 'Oman',          nameAr: 'عُمان' },
    { code: '+20',  iso: 'EG', nameEn: 'Egypt',         nameAr: 'مصر' },
    { code: '+213', iso: 'DZ', nameEn: 'Algeria',       nameAr: 'الجزائر' },
    { code: '+216', iso: 'TN', nameEn: 'Tunisia',       nameAr: 'تونس' },
    { code: '+218', iso: 'LY', nameEn: 'Libya',         nameAr: 'ليبيا' },
    { code: '+962', iso: 'JO', nameEn: 'Jordan',        nameAr: 'الأردن' },
    { code: '+961', iso: 'LB', nameEn: 'Lebanon',       nameAr: 'لبنان' },
    { code: '+963', iso: 'SY', nameEn: 'Syria',         nameAr: 'سوريا' },
    { code: '+964', iso: 'IQ', nameEn: 'Iraq',          nameAr: 'العراق' },
    { code: '+970', iso: 'PS', nameEn: 'Palestine',     nameAr: 'فلسطين' },
    { code: '+967', iso: 'YE', nameEn: 'Yemen',         nameAr: 'اليمن' },
    { code: '+90',  iso: 'TR', nameEn: 'Turkey',        nameAr: 'تركيا' },
    { code: '+1',   iso: 'US', nameEn: 'USA / Canada',  nameAr: 'الولايات المتحدة / كندا' },
    { code: '+44',  iso: 'GB', nameEn: 'UK',            nameAr: 'المملكة المتحدة' },
    { code: '+33',  iso: 'FR', nameEn: 'France',        nameAr: 'فرنسا' },
    { code: '+34',  iso: 'ES', nameEn: 'Spain',         nameAr: 'إسبانيا' },
    { code: '+39',  iso: 'IT', nameEn: 'Italy',         nameAr: 'إيطاليا' },
    { code: '+49',  iso: 'DE', nameEn: 'Germany',       nameAr: 'ألمانيا' },
    { code: '+31',  iso: 'NL', nameEn: 'Netherlands',   nameAr: 'هولندا' },
    { code: '+32',  iso: 'BE', nameEn: 'Belgium',       nameAr: 'بلجيكا' },
    { code: '+46',  iso: 'SE', nameEn: 'Sweden',        nameAr: 'السويد' },
    { code: '+45',  iso: 'DK', nameEn: 'Denmark',       nameAr: 'الدنمارك' },
    { code: '+41',  iso: 'CH', nameEn: 'Switzerland',   nameAr: 'سويسرا' },
];

// ISO alpha-2 → flag emoji via regional indicator letters.
const isoToFlag = (iso: string): string =>
    iso
        .toUpperCase()
        .split('')
        .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 'A'.charCodeAt(0)))
        .join('');

interface Props {
    /**
     * Full e.164 value, e.g. "+212612345678". May be empty.
     * Component splits on countryCode prefix to populate sub-fields.
     */
    value: string;
    onChange: (next: string) => void;
    lang?: 'en' | 'ar';
    placeholder?: string;
    /** Optional id for the local-number input (for label htmlFor). */
    inputId?: string;
}

/**
 * Splits an e.164 value into (countryCode, localDigits) by matching
 * the LONGEST prefix from the COUNTRIES list. We try longest-first
 * so "+1" doesn't swallow "+12...". Falls back to Morocco if no prefix
 * matches (e.g. empty value or a foreign code we haven't listed).
 */
function splitPhone(value: string): { country: Country; local: string } {
    const v = (value || '').trim();
    if (v.startsWith('+')) {
        // Sort by code length DESC so "+212" wins over "+2", "+966" over "+9".
        const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
        for (const c of sorted) {
            if (v.startsWith(c.code)) {
                return { country: c, local: v.slice(c.code.length) };
            }
        }
    }
    return { country: COUNTRIES[0], local: '' };
}

export const PhoneInput = ({ value, onChange, lang = 'en', placeholder, inputId }: Props) => {
    const { country, local } = useMemo(() => splitPhone(value), [value]);

    const emit = (nextCode: string, nextLocal: string) => {
        // Strip everything that isn't a digit from the local part — UI
        // accepts spaces/dashes for readability but we store raw digits.
        const digits = nextLocal.replace(/\D+/g, '');
        onChange(digits ? `${nextCode}${digits}` : '');
    };

    return (
        <div className="flex gap-2 w-full">
            <select
                value={country.code}
                onChange={(e) => emit(e.target.value, local)}
                className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-2 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 flex-shrink-0 max-w-[150px]"
                aria-label={lang === 'ar' ? 'رمز الدولة' : 'Country code'}
            >
                {COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.code}>
                        {isoToFlag(c.iso)} {c.code} {lang === 'ar' ? c.nameAr : c.nameEn}
                    </option>
                ))}
            </select>
            <div className="flex-1 flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 focus-within:ring-1 focus-within:ring-primary/30">
                <Phone size={14} className="text-on-surface/50 flex-shrink-0 me-2" />
                <input
                    id={inputId}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={local}
                    onChange={(e) => emit(country.code, e.target.value)}
                    placeholder={placeholder ?? (lang === 'ar' ? '612345678' : '612345678')}
                    className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface/30 py-2.5 focus:outline-none w-full"
                />
            </div>
        </div>
    );
};
