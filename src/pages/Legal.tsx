/**
 * Legal — bundles Terms of Service, Privacy Policy, and Health
 * Disclaimer into one page with anchor-style navigation.
 *
 * Why one component for three documents:
 *   - All three follow the same long-scroll heading + paragraphs
 *     pattern, so a single template keeps the design consistent
 *   - The contents share a "this is a template, get a lawyer to
 *     review for your jurisdiction" preamble — only renders once
 *   - Easier to translate to Arabic in one place
 *
 * Routes that hit this page:
 *   /terms     → renders the Terms section first
 *   /privacy   → renders the Privacy section first
 *   /health-disclaimer → renders the Health section first
 *
 * All sections are present on every variant; the route just
 * controls scroll-to-anchor on initial load.
 *
 * Content is intentionally NOT in translations.ts — too long to live
 * alongside UI strings. Stored as a local const here, keyed by
 * lang. Sections are an array so authors can re-order without
 * touching the renderer.
 *
 * IMPORTANT — review with a lawyer before publishing to a real
 * customer base. The templates here cover what most SaaS / fitness
 * apps need but jurisdiction-specific clauses (Moroccan consumer
 * protection law, GDPR, etc.) may need additions.
 */
import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FileText, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';

type Section = { id: string; heading: string; body: string[] };
type Doc = { title: string; updated: string; sections: Section[] };
type DocSet = { terms: Doc; privacy: Doc; health: Doc };

// ─────────────────────────────────────────────────────────────────
//  Content store — English
// ─────────────────────────────────────────────────────────────────
const EN: DocSet = {
    terms: {
        title: 'Terms of Service',
        updated: 'Last updated: May 23, 2026',
        sections: [
            {
                id: 'acceptance',
                heading: '1. Acceptance of Terms',
                body: [
                    'By creating an account or paying for a subscription on BioZackTeam (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not access or use the Service.',
                    'These Terms form a binding agreement between you ("user", "you") and BioZackTeam ("we", "us", "our"), the operator of the platform available at app.biozackteam.com.',
                ],
            },
            {
                id: 'service',
                heading: '2. Description of Service',
                body: [
                    'BioZackTeam is a digital fitness and coaching platform that provides access to: training programs, nutritional plans, educational video content (the "Academy"), weekly progress tracking tools, a member community feed, and, for coaching-tier subscribers, direct one-on-one messaging and personalized programs from a certified coach.',
                    'The Service is provided "as is" and we may add, remove, or modify features at any time. We will notify subscribers of material changes via email or in-app message at least 14 days in advance where reasonably possible.',
                ],
            },
            {
                id: 'eligibility',
                heading: '3. Eligibility',
                body: [
                    'You must be at least 18 years old to create an account and use the Service. By using the Service, you represent that you are of legal age in your jurisdiction and have the right and capacity to enter into these Terms.',
                    'You must not have any medical condition that prevents you from safely engaging in physical exercise, nutrition modifications, or related fitness activities. See the Health Disclaimer section for full details.',
                ],
            },
            {
                id: 'account',
                heading: '4. Your Account',
                body: [
                    'You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with anyone else. You are responsible for all activities that occur under your account.',
                    'You must provide accurate and current information when creating your account, and you agree to keep it up to date. We reserve the right to suspend or terminate accounts that contain false information.',
                    'If you believe your account has been accessed without your permission, contact us immediately at support@biozackteam.com.',
                ],
            },
            {
                id: 'subscription',
                heading: '5. Subscription, Billing, and Cancellation',
                body: [
                    'Access to the Service is offered through recurring subscription plans. Current plans include Community ($35 USD/month or $199 USD/year) and Coaching ($149 USD/month). Plan details and prices are subject to change with prior notice.',
                    'Payments are processed by Stripe, Inc. By subscribing you authorize us, through Stripe, to charge your selected payment method on the recurring billing date until you cancel.',
                    'You may cancel your subscription at any time from your account Settings or via the Stripe Customer Portal. Cancellations take effect at the end of the current billing period, and you will retain access until that date.',
                    'If a payment fails, we will attempt to retry the charge over a period of approximately seven business days. If payment cannot be collected within that window, your subscription will be canceled and your access suspended until you provide a working payment method.',
                ],
            },
            {
                id: 'acceptable-use',
                heading: '6. Acceptable Use',
                body: [
                    'You agree not to: share or resell your account credentials; copy, reproduce, distribute, or create derivative works of any content within the Service (including videos, training programs, and diet plans) without our written permission; abuse the messaging or community features (spam, harassment, hate speech, illegal content); attempt to bypass payment, authentication, or security mechanisms; reverse engineer, decompile, or otherwise attempt to extract the source code of the Service.',
                    'We may suspend or terminate your account immediately for any violation of this section.',
                ],
            },
            {
                id: 'ip',
                heading: '7. Intellectual Property',
                body: [
                    'All content provided through the Service — including training programs, video lessons, diet plans, written materials, branding, and software — is the exclusive property of BioZackTeam or its licensors and is protected by copyright and other intellectual property laws.',
                    'Your subscription grants you a personal, non-transferable, non-exclusive license to access and use this content for your own personal fitness use only. You may not record, screen-capture, redistribute, or republish any content without our prior written consent.',
                ],
            },
            {
                id: 'user-content',
                heading: '8. Your Content (Photos, Check-ins, Messages)',
                body: [
                    'You retain ownership of any content you upload to the Service, including progress photos, body measurements, weight logs, written notes, and private messages to your coach.',
                    'By uploading content you grant BioZackTeam a limited license to store, process, and display that content solely for the purpose of providing the Service to you. We will not publish or share your content publicly without your explicit consent.',
                    'If you cancel your subscription and request account deletion, your content will be deleted from our active systems within 30 days, subject to lawful retention requirements (e.g., billing records).',
                ],
            },
            {
                id: 'disclaimer',
                heading: '9. Health & Fitness Disclaimer',
                body: [
                    'BioZackTeam provides general fitness, nutrition, and educational information. We are not licensed medical professionals, and nothing in the Service constitutes medical advice, diagnosis, or treatment.',
                    'You should consult a qualified physician before starting any new exercise or nutrition program, especially if you have, or suspect you may have, a medical condition, are pregnant or nursing, are under 18 (and are using this Service in violation of the eligibility section), or are taking any medication.',
                    'You assume full responsibility for any injuries, illnesses, or other adverse effects that may occur as a result of using the Service. Stop immediately and seek medical attention if you experience pain, dizziness, shortness of breath, or any other concerning symptoms during exercise.',
                    'See the full Health Disclaimer for additional details.',
                ],
            },
            {
                id: 'liability',
                heading: '10. Limitation of Liability',
                body: [
                    'To the maximum extent permitted by applicable law, BioZackTeam, its founders, employees, and affiliates shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising out of or related to your use of the Service.',
                    'Our total aggregate liability to you for any claim arising out of these Terms or the Service shall not exceed the total amount you have paid us in the twelve (12) months preceding the claim.',
                ],
            },
            {
                id: 'termination',
                heading: '11. Termination',
                body: [
                    'You may stop using the Service at any time by canceling your subscription and requesting account deletion. We may suspend or terminate your access to the Service at our discretion for violations of these Terms, non-payment, or for any other lawful reason.',
                    'Provisions that by their nature should survive termination (including intellectual property, limitation of liability, and dispute resolution) shall survive.',
                ],
            },
            {
                id: 'changes',
                heading: '12. Changes to These Terms',
                body: [
                    'We may update these Terms from time to time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.',
                ],
            },
            {
                id: 'governing-law',
                heading: '13. Governing Law and Disputes',
                body: [
                    'These Terms are governed by the laws of the Kingdom of Morocco, without regard to its conflict-of-laws principles. Any disputes arising out of or in connection with these Terms shall be resolved through good-faith negotiation in the first instance. If a dispute cannot be resolved, it will be submitted to the competent courts of Casablanca, Morocco.',
                ],
            },
            {
                id: 'contact',
                heading: '14. Contact',
                body: [
                    'Questions about these Terms? Email us at legal@biozackteam.com.',
                    'For billing or invoice questions: billing@biozackteam.com',
                    'For general support: support@biozackteam.com',
                ],
            },
        ],
    },
    privacy: {
        title: 'Privacy Policy',
        updated: 'Last updated: May 23, 2026',
        sections: [
            {
                id: 'overview',
                heading: '1. Overview',
                body: [
                    'BioZackTeam ("we", "us", "our") respects your privacy. This Privacy Policy explains what data we collect, how we use it, who we share it with, and what choices you have about your information.',
                    'This policy applies to the BioZackTeam web application at app.biozackteam.com and any related services.',
                ],
            },
            {
                id: 'collect',
                heading: '2. Information We Collect',
                body: [
                    'Account information: your name, email address, and authentication credentials.',
                    'Payment information: handled directly by Stripe. We do not store your credit card number — only a Stripe customer ID linking your account to your billing record.',
                    'Fitness data: body weight, body measurements, progress photos you choose to upload, subjective check-in scores (strength, hunger, energy), cardio calories burned, and any notes you add.',
                    'Communications: messages you send to or receive from your coach, posts you make on the community feed, and content of broadcast notifications you receive.',
                    'Usage data: device type, browser, operating system, app version, language, theme preference, time spent on each surface, and which features you use most. We use this data only to improve the product, never to sell to third parties.',
                    'Error and crash reports: when the app malfunctions, we may automatically capture a description of the error, a stack trace, and the actions you took right before the error. Personal information is redacted before this data is sent to our error monitoring service (Sentry).',
                    'Push notification tokens: anonymous device identifiers we use to send notifications. You can revoke these any time in your device settings.',
                ],
            },
            {
                id: 'use',
                heading: '3. How We Use Your Information',
                body: [
                    'To provide the Service: deliver training programs, store check-in data, route messages between you and your coach, and personalize your experience.',
                    'To process payments: charge your subscription via Stripe and handle billing inquiries.',
                    'To communicate with you: send service announcements, weekly reminders, coach broadcasts, and (only if you opt in) marketing communications.',
                    'To improve the product: identify bugs, measure feature usage in aggregate, and make data-informed improvements.',
                    'To comply with legal obligations: respond to lawful requests from authorities, enforce our Terms, and protect our rights.',
                ],
            },
            {
                id: 'sharing',
                heading: '4. Third Parties We Share Data With',
                body: [
                    'Stripe (payments): handles all credit-card processing. Stripe receives your name, email, billing address, and payment details. Stripe is PCI-DSS Level 1 compliant. See Stripe\'s Privacy Policy at https://stripe.com/privacy.',
                    'Google Firebase (hosting + database): hosts the application and stores user data. Firebase is operated by Google LLC and complies with applicable data protection laws. See https://firebase.google.com/support/privacy.',
                    'Sentry (error monitoring): receives error reports and limited contextual data when the app crashes. Personal information is redacted before transmission. See https://sentry.io/privacy/.',
                    'We do not sell, rent, or trade your personal information to any third party for marketing purposes.',
                ],
            },
            {
                id: 'retention',
                heading: '5. Data Retention',
                body: [
                    'We retain your account data for as long as your subscription is active, plus a reasonable period afterward for billing reconciliation and legal compliance (typically 7 years for tax records, in accordance with Moroccan law).',
                    'You may request deletion of your account at any time by emailing support@biozackteam.com. We will delete your data from active systems within 30 days, subject to backup-rotation cycles (typically up to 90 days) and any legal retention requirements.',
                ],
            },
            {
                id: 'rights',
                heading: '6. Your Rights',
                body: [
                    'You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your account and associated data; request a portable export of your data (delivered as JSON within 30 days); object to processing for direct marketing; and withdraw consent at any time.',
                    'If you are a resident of the European Union, the United Kingdom, or another jurisdiction that grants additional data protection rights (such as California), you have those additional rights as applicable by law. To exercise any right, contact us at privacy@biozackteam.com.',
                ],
            },
            {
                id: 'cookies',
                heading: '7. Cookies and Local Storage',
                body: [
                    'We use browser local storage to remember your language preference, theme choice, and authentication state so you do not have to re-log in on every visit.',
                    'We do not use third-party advertising cookies on the application. Our marketing landing page may use analytics cookies which are disclosed separately on that site.',
                ],
            },
            {
                id: 'security',
                heading: '8. Security',
                body: [
                    'We take reasonable measures to protect your information: TLS encryption in transit, encrypted at rest in our database, role-based access controls on internal tools, and regular security reviews.',
                    'No system is 100% secure. If you believe your account has been compromised, contact us immediately at security@biozackteam.com.',
                ],
            },
            {
                id: 'children',
                heading: '9. Children\'s Privacy',
                body: [
                    'The Service is not intended for individuals under 18. We do not knowingly collect data from anyone under 18. If you believe a minor has provided us with personal data, contact us and we will delete it promptly.',
                ],
            },
            {
                id: 'changes',
                heading: '10. Changes to This Policy',
                body: [
                    'We may update this Privacy Policy from time to time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect.',
                ],
            },
            {
                id: 'contact',
                heading: '11. Contact',
                body: [
                    'Questions about this Privacy Policy or your data? Email privacy@biozackteam.com.',
                ],
            },
        ],
    },
    health: {
        title: 'Health & Fitness Disclaimer',
        updated: 'Last updated: May 23, 2026',
        sections: [
            {
                id: 'not-medical',
                heading: '1. Not Medical Advice',
                body: [
                    'BioZackTeam provides general fitness, nutrition, and educational content. We are not licensed physicians, registered dietitians, physical therapists, or any other type of certified medical professional. Nothing in the Service constitutes medical advice, diagnosis, treatment, prescription, or recommendation.',
                    'Any information you find in our training programs, diet plans, academy videos, or messages from our coach is for general informational and educational purposes only and is not a substitute for professional medical advice.',
                ],
            },
            {
                id: 'consult',
                heading: '2. Consult Your Physician',
                body: [
                    'Before beginning any exercise program or making significant changes to your diet, you should consult a qualified physician — especially if you: have or suspect you may have a heart condition, high blood pressure, diabetes, asthma, joint or back problems, an eating disorder, or any other chronic medical condition; are pregnant, recently pregnant, or nursing; are recovering from surgery or an injury; are taking prescription medication.',
                    'Your physician knows your full medical history and is the appropriate professional to clear you for exercise and nutritional changes.',
                ],
            },
            {
                id: 'risk',
                heading: '3. Assumption of Risk',
                body: [
                    'Physical exercise carries inherent risks of injury, including but not limited to muscle strains, joint injuries, falls, and (in rare cases) cardiac events. By using the Service, you acknowledge these risks and assume full responsibility for any injury, illness, or adverse effect that may result.',
                    'You agree to use the Service at your own risk and to release BioZackTeam from any claim of injury, loss, or damages arising from your participation.',
                ],
            },
            {
                id: 'stop',
                heading: '4. Stop and Seek Help If You Feel Unwell',
                body: [
                    'If at any time during exercise you experience chest pain, shortness of breath, dizziness, lightheadedness, severe joint pain, blurred vision, or any other concerning symptom — stop immediately and seek medical attention.',
                    'Do not push through symptoms. Pain is a signal, not an obstacle.',
                ],
            },
            {
                id: 'nutrition',
                heading: '5. Nutrition Information',
                body: [
                    'Caloric targets, macro splits, and meal suggestions provided in the Service are general estimates based on typical adult populations. They may not be appropriate for your individual needs, allergies, intolerances, or medical conditions.',
                    'If you have any food allergies, intolerances, or have been advised by a medical professional to follow a specific diet, you must follow your medical guidance and not the generic suggestions provided in the Service.',
                ],
            },
            {
                id: 'results',
                heading: '6. No Guarantee of Results',
                body: [
                    'Individual fitness and body composition results vary widely and depend on many factors outside our control, including genetics, adherence to the program, sleep, stress, medications, and pre-existing health status. We make no representations or warranties about specific weight loss, strength gains, body composition changes, or other physical outcomes you may or may not achieve through the Service.',
                ],
            },
            {
                id: 'agreement',
                heading: '7. Your Agreement',
                body: [
                    'By using the Service, you acknowledge that you have read and understood this Disclaimer, that you are physically and mentally able to participate in fitness activities, and that you accept full responsibility for your health and safety.',
                ],
            },
        ],
    },
};

// ─────────────────────────────────────────────────────────────────
//  Content store — Arabic
// ─────────────────────────────────────────────────────────────────
const AR: DocSet = {
    terms: {
        title: 'شروط الخدمة',
        updated: 'آخر تحديث: 23 مايو 2026',
        sections: [
            {
                id: 'acceptance',
                heading: '1. قبول الشروط',
                body: [
                    'بإنشاء حساب أو اشتراك مدفوع على بيوزاك تيم («الخدمة»)، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، فيجب عليك عدم استخدام الخدمة.',
                    'تشكّل هذه الشروط اتفاقاً ملزماً بينك («المستخدم») وبين بيوزاك تيم («نحن»)، مشغّل المنصة المتاحة على app.biozackteam.com.',
                ],
            },
            {
                id: 'service',
                heading: '2. وصف الخدمة',
                body: [
                    'بيوزاك تيم منصّة رقمية للياقة البدنية والتدريب تقدّم: برامج تدريبية، خطط غذائية، محتوى فيديو تعليمي («الأكاديمية»)، أدوات تتبّع التقدم الأسبوعي، فيد مجتمعي للأعضاء، ولمشتركي باقة التدريب: رسائل مباشرة مع المدرّب وبرامج شخصية مخصّصة.',
                    'تُقدَّم الخدمة «كما هي» ويمكننا إضافة أو إزالة أو تعديل الميزات في أي وقت. سنخطر المشتركين بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق قبل 14 يوماً على الأقل حيثما أمكن ذلك.',
                ],
            },
            {
                id: 'eligibility',
                heading: '3. الأهلية',
                body: [
                    'يجب أن تكون في الثامنة عشرة من العمر على الأقل لإنشاء حساب واستخدام الخدمة. باستخدام الخدمة، فإنك تؤكّد أنك بلغت السن القانوني في بلدك ولديك الحق والقدرة على الدخول في هذه الشروط.',
                    'يجب ألّا تكون لديك أي حالة طبية تمنعك من ممارسة النشاط البدني أو تعديلات النظام الغذائي بأمان. راجع قسم إخلاء المسؤولية الصحية للاطّلاع على التفاصيل الكاملة.',
                ],
            },
            {
                id: 'account',
                heading: '4. حسابك',
                body: [
                    'أنت مسؤول عن الحفاظ على سرية بيانات الدخول الخاصة بحسابك. يجب عدم مشاركة الحساب مع أي شخص آخر. أنت مسؤول عن جميع الأنشطة التي تتمّ تحت حسابك.',
                    'يجب تقديم معلومات دقيقة ومحدّثة عند إنشاء حسابك. نحتفظ بالحق في تعليق أو إنهاء الحسابات التي تحتوي معلومات كاذبة.',
                    'إذا كنت تعتقد أن حسابك قد تمّ اختراقه، تواصل معنا فوراً على support@biozackteam.com.',
                ],
            },
            {
                id: 'subscription',
                heading: '5. الاشتراك والفوترة والإلغاء',
                body: [
                    'يُتاح الوصول إلى الخدمة عبر باقات اشتراك متكرّرة. الباقات الحالية تشمل: المجتمع (35 دولار شهرياً أو 199 دولار سنوياً) والتدريب (149 دولار شهرياً). تفاصيل الباقات والأسعار قابلة للتغيير بإشعار مسبق.',
                    'تُعالَج المدفوعات عبر شركة سترايب. بالاشتراك، فإنك تخوّلنا (عبر سترايب) بخصم المبلغ من وسيلة الدفع المختارة في تاريخ الفوترة المتكرّر حتى إلغائك.',
                    'يمكنك إلغاء اشتراكك في أي وقت من إعدادات حسابك أو عبر بوابة سترايب للعملاء. تسري الإلغاءات في نهاية فترة الفوترة الحالية، وستحتفظ بالوصول حتى ذلك التاريخ.',
                    'إذا فشلت الدفعة، سنحاول إعادة المحاولة على مدى نحو 7 أيام عمل. إذا تعذّر تحصيل الدفع خلال هذه المدة، يتمّ إلغاء اشتراكك وإيقاف وصولك حتى تُحدّث وسيلة دفع صالحة.',
                ],
            },
            {
                id: 'acceptable-use',
                heading: '6. الاستخدام المقبول',
                body: [
                    'توافق على عدم: مشاركة أو إعادة بيع بيانات الدخول؛ نسخ أو إعادة توزيع أي محتوى داخل الخدمة (بما في ذلك الفيديوهات والبرامج التدريبية والخطط الغذائية) دون إذن خطّي منّا؛ إساءة استخدام ميزات المراسلة أو المجتمع (سبام، تحرّش، خطاب كراهية، محتوى غير قانوني)؛ محاولة تجاوز آليات الدفع أو المصادقة أو الأمان؛ الهندسة العكسية للخدمة.',
                    'يمكننا تعليق أو إنهاء حسابك فوراً عند أي مخالفة لهذا القسم.',
                ],
            },
            {
                id: 'ip',
                heading: '7. الملكية الفكرية',
                body: [
                    'جميع المحتويات المقدّمة عبر الخدمة — بما في ذلك البرامج التدريبية والفيديوهات والخطط الغذائية والعلامة والبرمجيات — هي ملكية حصرية لبيوزاك تيم أو مرخّصيها وتحميها قوانين حقوق النشر والملكية الفكرية.',
                    'يمنحك اشتراكك ترخيصاً شخصياً، غير قابل للنقل، وغير حصري للوصول إلى هذا المحتوى واستخدامه لأغراض اللياقة الشخصية فقط. لا يجوز تسجيل أو نشر أو إعادة توزيع أي محتوى دون موافقتنا الخطّية المسبقة.',
                ],
            },
            {
                id: 'user-content',
                heading: '8. محتواك (الصور والمتابعات والرسائل)',
                body: [
                    'تحتفظ بملكية أي محتوى ترفعه إلى الخدمة، بما في ذلك صور التقدم وقياسات الجسم وسجلات الوزن والملاحظات والرسائل الخاصة مع مدرّبك.',
                    'برفع المحتوى، فإنك تمنحنا ترخيصاً محدوداً لتخزينه ومعالجته وعرضه فقط لأغراض تقديم الخدمة لك. لن ننشر أو نشارك محتواك علناً دون موافقتك الصريحة.',
                    'إذا ألغيت اشتراكك وطلبت حذف الحساب، سيُحذف محتواك من أنظمتنا النشطة خلال 30 يوماً، باستثناء ما يلزم الاحتفاظ به قانونياً (مثل سجلات الفوترة).',
                ],
            },
            {
                id: 'disclaimer',
                heading: '9. إخلاء المسؤولية الصحية',
                body: [
                    'يقدّم بيوزاك تيم معلومات عامة عن اللياقة والتغذية. لسنا أطبّاء مرخّصين ولا شيء في الخدمة يُعدّ نصيحة طبية أو تشخيصاً أو علاجاً.',
                    'يجب استشارة طبيب مؤهّل قبل بدء أي برنامج رياضي أو غذائي جديد، خاصةً إذا كانت لديك حالة طبية أو أنت حامل أو ترضعين أو تتناول دواءً ما.',
                    'تتحمّل المسؤولية الكاملة عن أي إصابات أو آثار سلبية قد تنتج عن استخدام الخدمة. توقّف فوراً واطلب المساعدة الطبية إذا شعرت بألم أو دوار أو ضيق تنفّس أثناء التمرين.',
                    'راجع إخلاء المسؤولية الصحية الكامل للمزيد من التفاصيل.',
                ],
            },
            {
                id: 'liability',
                heading: '10. تحديد المسؤولية',
                body: [
                    'إلى أقصى حدّ يسمح به القانون، لن يكون بيوزاك تيم ومؤسّسوها وموظّفوها مسؤولين عن أي أضرار غير مباشرة أو عرضية أو تبعية أو خاصة أو عقابية ناشئة عن استخدامك للخدمة.',
                    'لن تتجاوز مسؤوليتنا الإجمالية تجاهك عن أي مطالبة إجمالي ما دفعته لنا خلال الاثني عشر شهراً السابقة للمطالبة.',
                ],
            },
            {
                id: 'termination',
                heading: '11. الإنهاء',
                body: [
                    'يمكنك التوقف عن استخدام الخدمة في أي وقت بإلغاء اشتراكك وطلب حذف الحساب. يمكننا تعليق أو إنهاء وصولك للخدمة وفقاً لتقديرنا في حالة مخالفة هذه الشروط أو عدم السداد أو لأي سبب قانوني آخر.',
                    'الأحكام التي تستمر طبيعتها بعد الإنهاء (مثل الملكية الفكرية وتحديد المسؤولية) تبقى سارية.',
                ],
            },
            {
                id: 'changes',
                heading: '12. تغييرات على الشروط',
                body: [
                    'قد نحدّث هذه الشروط من حين لآخر. سنبلّغك بالتغييرات الجوهرية عبر البريد أو إشعار داخل التطبيق قبل 14 يوماً على الأقل. استمرارك في استخدام الخدمة بعد تاريخ السريان يعني قبول الشروط المحدّثة.',
                ],
            },
            {
                id: 'governing-law',
                heading: '13. القانون الحاكم والنزاعات',
                body: [
                    'تخضع هذه الشروط لقوانين المملكة المغربية. تُحَلّ أي نزاعات أولاً عبر التفاوض بحسن نية. إن تعذّر ذلك، تُحال إلى المحاكم المختصة في الدار البيضاء بالمغرب.',
                ],
            },
            {
                id: 'contact',
                heading: '14. تواصل معنا',
                body: [
                    'أسئلة حول هذه الشروط؟ راسلنا على legal@biozackteam.com',
                    'استفسارات الفوترة والفواتير: billing@biozackteam.com',
                    'الدعم العام: support@biozackteam.com',
                ],
            },
        ],
    },
    privacy: {
        title: 'سياسة الخصوصية',
        updated: 'آخر تحديث: 23 مايو 2026',
        sections: [
            {
                id: 'overview',
                heading: '1. نظرة عامة',
                body: [
                    'يحترم بيوزاك تيم خصوصيّتك. تشرح هذه السياسة البيانات التي نجمعها، وكيف نستخدمها، ومع من نشاركها، وما الخيارات المتاحة لك بشأن معلوماتك.',
                    'تنطبق هذه السياسة على تطبيق الويب على app.biozackteam.com وأي خدمات مرتبطة به.',
                ],
            },
            {
                id: 'collect',
                heading: '2. المعلومات التي نجمعها',
                body: [
                    'معلومات الحساب: اسمك، بريدك الإلكتروني، وبيانات المصادقة.',
                    'معلومات الدفع: تتمّ معالجتها مباشرةً من قِبَل سترايب. لا نحفظ رقم بطاقتك الائتمانية — فقط معرّف عميل سترايب الذي يربط حسابك بسجلّ الفوترة.',
                    'بيانات اللياقة: وزن الجسم، قياسات الجسم، صور التقدّم التي تختار رفعها، تقييمات المتابعة الذاتية (القوّة، الجوع، الطاقة)، سعرات الكارديو، وأي ملاحظات تضيفها.',
                    'الاتّصالات: الرسائل التي ترسلها أو تستلمها من مدرّبك، المنشورات على فيد المجتمع، ومحتوى الإشعارات الجماعية التي تستلمها.',
                    'بيانات الاستخدام: نوع الجهاز، المتصفّح، نظام التشغيل، إصدار التطبيق، اللغة، السمة، الوقت المُمضى في كل واجهة، والميزات الأكثر استخداماً. نستخدم هذه البيانات فقط لتحسين المنتج، ولا نبيعها لأي طرف ثالث.',
                    'تقارير الأخطاء والأعطال: عند خلل التطبيق، قد نلتقط تلقائياً وصفاً للخطأ والإجراءات التي سبقته. تُحجَب المعلومات الشخصية قبل إرسالها لخدمة مراقبة الأخطاء (Sentry).',
                    'رموز الإشعارات: معرّفات أجهزة مجهولة الهوية نستخدمها لإرسال الإشعارات. يمكنك إلغاؤها في أي وقت من إعدادات جهازك.',
                ],
            },
            {
                id: 'use',
                heading: '3. كيف نستخدم معلوماتك',
                body: [
                    'لتقديم الخدمة: تسليم البرامج التدريبية، تخزين بيانات المتابعة، توجيه الرسائل بينك وبين مدرّبك، وتخصيص تجربتك.',
                    'لمعالجة المدفوعات: خصم اشتراكك عبر سترايب ومعالجة استفسارات الفوترة.',
                    'للتواصل معك: إرسال إعلانات الخدمة، التذكيرات الأسبوعية، إشعارات الكوتش، و(إذا اخترت الاشتراك) رسائل تسويقية.',
                    'لتحسين المنتج: تحديد الأخطاء وقياس استخدام الميزات بشكل مُجمَّع.',
                    'للامتثال للالتزامات القانونية: الاستجابة للطلبات الرسمية، وتطبيق شروطنا، وحماية حقوقنا.',
                ],
            },
            {
                id: 'sharing',
                heading: '4. الأطراف الثالثة التي نشارك البيانات معها',
                body: [
                    'سترايب (المدفوعات): تتولّى جميع معالجة البطاقات الائتمانية. تستلم اسمك وبريدك وعنوان الفوترة وتفاصيل الدفع. سترايب معتمدة PCI-DSS Level 1. راجع سياستها على https://stripe.com/privacy.',
                    'Google Firebase (الاستضافة وقاعدة البيانات): تستضيف التطبيق وتخزّن بيانات المستخدمين. تُشغّلها Google LLC وتلتزم بقوانين حماية البيانات السارية.',
                    'Sentry (مراقبة الأخطاء): تستلم تقارير الأخطاء وبيانات سياقية محدودة عند تعطّل التطبيق. تُحجَب المعلومات الشخصية قبل النقل.',
                    'لا نبيع أو نؤجّر أو نتاجر بمعلوماتك الشخصية لأي طرف ثالث لأغراض التسويق.',
                ],
            },
            {
                id: 'retention',
                heading: '5. الاحتفاظ بالبيانات',
                body: [
                    'نحتفظ ببيانات حسابك ما دام اشتراكك نشطاً، بالإضافة إلى فترة معقولة بعده للمحاسبة والامتثال القانوني (عادةً 7 سنوات لسجلات الضرائب وفقاً للقانون المغربي).',
                    'يمكنك طلب حذف حسابك في أي وقت بمراسلة support@biozackteam.com. سنحذف بياناتك من أنظمتنا النشطة خلال 30 يوماً، باستثناء ما تقتضيه دورات النسخ الاحتياطي (حتى 90 يوماً) والمتطلبات القانونية.',
                ],
            },
            {
                id: 'rights',
                heading: '6. حقوقك',
                body: [
                    'لك الحق في: الوصول إلى بياناتك الشخصية، طلب تصحيحها، طلب حذفها، طلب نسخة محمولة من بياناتك (تُسلَّم كملف JSON خلال 30 يوماً)، الاعتراض على معالجتها لأغراض التسويق المباشر، وسحب موافقتك في أي وقت.',
                    'إذا كنت من سكان الاتحاد الأوروبي أو المملكة المتحدة أو ولاية كاليفورنيا أو أي ولاية تمنح حقوقاً إضافية، فإنك تتمتّع بهذه الحقوق الإضافية. لممارسة أي حقّ، راسلنا على privacy@biozackteam.com.',
                ],
            },
            {
                id: 'cookies',
                heading: '7. ملفّات تعريف الارتباط',
                body: [
                    'نستخدم التخزين المحلّي في المتصفّح لتذكّر تفضيلات اللغة والسمة وحالة المصادقة حتى لا تضطر لتسجيل الدخول في كل زيارة.',
                    'لا نستخدم ملفّات تعريف ارتباط إعلانية لأطراف ثالثة داخل التطبيق. قد تستخدم صفحة التسويق ملفّات تحليلات يُكشف عنها هناك بشكل منفصل.',
                ],
            },
            {
                id: 'security',
                heading: '8. الأمان',
                body: [
                    'نتّخذ تدابير معقولة لحماية معلوماتك: تشفير TLS أثناء النقل، تشفير في حالة السكون، تحكّمات وصول مبنيّة على الأدوار للأدوات الداخلية، ومراجعات أمنية دورية.',
                    'لا يوجد نظام آمن 100%. إذا اعتقدت أن حسابك قد تمّ اختراقه، تواصل معنا فوراً على security@biozackteam.com.',
                ],
            },
            {
                id: 'children',
                heading: '9. خصوصية القاصرين',
                body: [
                    'الخدمة غير مخصّصة لمن هم دون 18 عاماً. لا نجمع بيانات متعمّداً ممن هم دون هذا السن. إذا كنت تعتقد أن قاصراً قد قدّم لنا بيانات شخصية، تواصل معنا وسنحذفها فوراً.',
                ],
            },
            {
                id: 'changes',
                heading: '10. تغييرات على هذه السياسة',
                body: [
                    'قد نحدّث هذه السياسة من حين لآخر. سنبلّغك بالتغييرات الجوهرية عبر البريد أو إشعار داخل التطبيق قبل 14 يوماً على الأقل.',
                ],
            },
            {
                id: 'contact',
                heading: '11. تواصل معنا',
                body: [
                    'أسئلة حول هذه السياسة أو بياناتك؟ راسلنا على privacy@biozackteam.com.',
                ],
            },
        ],
    },
    health: {
        title: 'إخلاء المسؤولية الصحية',
        updated: 'آخر تحديث: 23 مايو 2026',
        sections: [
            {
                id: 'not-medical',
                heading: '1. ليست نصيحة طبية',
                body: [
                    'يقدّم بيوزاك تيم محتوى عاماً عن اللياقة والتغذية والتعليم. لسنا أطبّاء أو اختصاصيي تغذية أو علاجاً طبيعياً مرخّصين. لا يُعدّ أي شيء في الخدمة نصيحة طبية أو تشخيصاً أو علاجاً أو وصفة طبية.',
                    'أي معلومات في برامجنا التدريبية وخططنا الغذائية وفيديوهات الأكاديمية أو رسائل الكوتش هي لأغراض عامة وتعليمية فقط وليست بديلاً عن النصيحة الطبية المهنية.',
                ],
            },
            {
                id: 'consult',
                heading: '2. استشر طبيبك',
                body: [
                    'قبل بدء أي برنامج رياضي أو تغييرات غذائية كبيرة، يجب استشارة طبيب مؤهّل — خاصةً إذا كانت لديك حالة قلبية، ضغط دم مرتفع، سكري، ربو، مشاكل في المفاصل أو الظهر، اضطراب في الأكل، أو أي حالة مزمنة؛ أو إذا كنت حاملاً أو ترضعين؛ أو تتعافى من جراحة أو إصابة؛ أو تتناول أدوية بوصفة طبية.',
                    'طبيبك يعرف تاريخك الطبي الكامل وهو المختصّ بتقييم جاهزيّتك للتمرين والتغييرات الغذائية.',
                ],
            },
            {
                id: 'risk',
                heading: '3. تحمّل المخاطر',
                body: [
                    'ينطوي النشاط البدني على مخاطر إصابة محتملة. باستخدام الخدمة، فإنك تُقرّ بهذه المخاطر وتتحمّل المسؤولية الكاملة عن أي إصابة أو مرض أو أثر سلبي قد ينتج عن مشاركتك.',
                    'توافق على استخدام الخدمة على مسؤوليّتك الخاصة وإبراء بيوزاك تيم من أي مطالبة بإصابة أو خسارة أو أضرار ناشئة عن مشاركتك.',
                ],
            },
            {
                id: 'stop',
                heading: '4. توقّف واطلب المساعدة إذا شعرت بتوعّك',
                body: [
                    'إذا شعرت في أي وقت أثناء التمرين بألم في الصدر، ضيق تنفس، دوار، ألم شديد في المفاصل، رؤية ضبابية، أو أي عرض مقلق آخر — توقّف فوراً واطلب المساعدة الطبية.',
                    'لا تتجاوز الأعراض. الألم إشارة، وليس عائقاً تتجاوزه.',
                ],
            },
            {
                id: 'nutrition',
                heading: '5. معلومات التغذية',
                body: [
                    'الأهداف السعرية وتقسيمات الماكروز واقتراحات الوجبات المقدّمة في الخدمة هي تقديرات عامة للبالغين النموذجيين. قد لا تكون مناسبة لاحتياجاتك الفردية أو حساسياتك أو حالاتك الطبية.',
                    'إذا كان لديك أي حساسية غذائية أو نصحك مختصّ طبي باتّباع حمية معيّنة، عليك اتّباع التوجيه الطبي وليس الاقتراحات العامة في الخدمة.',
                ],
            },
            {
                id: 'results',
                heading: '6. لا ضمان للنتائج',
                body: [
                    'تختلف نتائج اللياقة وتركيب الجسم بشكل واسع وتعتمد على عوامل خارجة عن سيطرتنا، بما فيها الجينات والالتزام والنوم والإجهاد والأدوية والحالة الصحية. لا نقدّم أي ضمانات بشأن نتائج معيّنة لخسارة الوزن أو زيادة القوة أو تركيب الجسم.',
                ],
            },
            {
                id: 'agreement',
                heading: '7. موافقتك',
                body: [
                    'باستخدام الخدمة، فإنك تؤكّد أنك قرأت وفهمت هذا الإخلاء وأنك قادر بدنياً وذهنياً على المشاركة في الأنشطة الرياضية وأنك تقبل المسؤولية الكاملة عن صحّتك وسلامتك.',
                ],
            },
        ],
    },
};

// ─────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────

function tabFromPath(pathname: string): keyof DocSet {
    if (pathname.startsWith('/privacy')) return 'privacy';
    if (pathname.startsWith('/health')) return 'health';
    return 'terms';
}

export const Legal = () => {
    const { lang, isRTL } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = tabFromPath(location.pathname);
    const docs = lang === 'ar' ? AR : EN;
    const doc = docs[activeTab];

    // Smooth-scroll to top whenever the active doc changes.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    const tabMeta = [
        { key: 'terms',   label: lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service', icon: FileText,       path: '/terms' },
        { key: 'privacy', label: lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', icon: Shield,         path: '/privacy' },
        { key: 'health',  label: lang === 'ar' ? 'إخلاء المسؤولية الصحية' : 'Health Disclaimer', icon: AlertTriangle, path: '/health-disclaimer' },
    ] as const;

    return (
        <div className="min-h-screen bg-surface text-on-surface" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <div className="max-w-3xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-24">
                {/* Back link — present on the public-facing legal pages,
                    so a Stripe Checkout footer click → land on /terms
                    → can go back to the marketing site. We deliberately
                    use a generic "← Back" rather than a hardcoded URL
                    so it works whether the visitor came from the app or
                    the landing site. */}
                <button
                    type="button"
                    onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                    className="inline-flex items-center gap-2 text-[12px] font-label font-bold uppercase tracking-[0.18em] text-on-surface/60 hover:text-primary transition-colors mb-8"
                >
                    <ArrowLeft size={14} />
                    {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>

                {/* Tab strip — switch between Terms / Privacy / Health.
                    Mobile-first horizontal scroll if it ever gets longer. */}
                <div className="flex flex-wrap gap-2 mb-10">
                    {tabMeta.map((t) => {
                        const Icon = t.icon;
                        const active = activeTab === t.key;
                        return (
                            <Link
                                key={t.key}
                                to={t.path}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-body font-medium transition-all"
                                style={{
                                    background: active ? 'rgb(var(--primary) / 0.16)' : 'rgb(var(--surface-container-low) / 0.65)',
                                    color: active ? 'rgb(var(--primary))' : 'rgb(var(--on-surface-variant))',
                                    border: active
                                        ? '1px solid rgb(var(--primary) / 0.42)'
                                        : '1px solid rgb(var(--outline-variant) / 0.30)',
                                }}
                            >
                                <Icon size={14} strokeWidth={2.2} />
                                {t.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Document header */}
                <header className="mb-10">
                    <h1 className="font-display font-extrabold text-on-surface text-[36px] md:text-[44px] leading-[1] tracking-tight mb-3">
                        {doc.title}
                    </h1>
                    <p className="text-on-surface/55 font-body text-sm">{doc.updated}</p>
                </header>

                {/* Sections */}
                <div className="space-y-9">
                    {doc.sections.map((section) => (
                        <section key={section.id} id={section.id}>
                            <h2 className="font-headline font-extrabold text-on-surface text-[18px] md:text-[20px] tracking-tight mb-3">
                                {section.heading}
                            </h2>
                            <div className="space-y-3">
                                {section.body.map((para, i) => (
                                    <p key={i} className="font-body text-on-surface/80 text-[14.5px] leading-relaxed">
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
};
