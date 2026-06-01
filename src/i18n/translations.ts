export type Language = 'en' | 'ar';

export const translations = {
    // --- Common ---
    appName: { en: 'BioZackTeam', ar: 'بيوزاك تيم' },
    workspace: { en: 'workspace', ar: 'مساحة العمل' },
    signOut: { en: 'Sign out', ar: 'تسجيل الخروج' },
    cancel: { en: 'Cancel', ar: 'إلغاء' },
    save: { en: 'Save', ar: 'حفظ' },
    delete: { en: 'Delete', ar: 'حذف' },
    confirm: { en: 'Confirm', ar: 'تأكيد' },
    search: { en: 'Search', ar: 'بحث' },
    all: { en: 'All', ar: 'الكل' },
    add: { en: 'Add', ar: 'إضافة' },
    edit: { en: 'Edit', ar: 'تعديل' },
    close: { en: 'Close', ar: 'إغلاق' },
    done: { en: 'Done', ar: 'تم' },
    week: { en: 'Week', ar: 'الأسبوع' },
    yes: { en: 'Yes', ar: 'نعم' },
    no: { en: 'No', ar: 'لا' },
    view: { en: 'View', ar: 'عرض' },

    // --- Roles ---
    coach: { en: 'Coach', ar: 'المدرب' },
    admin: { en: 'Admin', ar: 'مدير' },
    client: { en: 'Coaching Client', ar: 'عميل تدريب' },
    community: { en: 'Community', ar: 'المجتمع' },

    // --- Sidebar Nav ---
    navDashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
    navCheckIns: { en: 'My Check-Ins', ar: 'تسجيلاتي' },
    navClients: { en: 'My Clients', ar: 'عملائي' },
    navVideoLibrary: { en: 'University', ar: 'الأكاديمية' },
    navWorkouts: { en: 'Workouts', ar: 'التمارين' },
    navProfile: { en: 'Update', ar: 'التحديث' },

    // --- Login Page ---
    loginWelcome: { en: 'Welcome to', ar: 'مرحباً بك في' },
    loginSubtitle: { en: 'Experience the complete fitness ecosystem. Choose a role to explore the platform.', ar: 'اكتشف نظام اللياقة المتكامل. اختر دوراً لاستكشاف المنصة.' },
    loginCoachView: { en: 'Coach View', ar: 'عرض المدرب' },
    loginCoachDesc: { en: 'Full admin & client management', ar: 'إدارة كاملة وإدارة العملاء' },
    loginClientView: { en: 'Coaching Client', ar: 'عميل تدريب' },
    loginClientDesc: { en: 'Weekly check-ins & macros', ar: 'تسجيلات أسبوعية وحساب السعرات' },
    loginCommunityView: { en: 'Community Member', ar: 'عضو المجتمع' },
    loginCommunityDesc: { en: 'Video library access', ar: 'الوصول لمكتبة الفيديو' },
    loginSignIn: { en: 'Sign Back In', ar: 'تسجيل الدخول' },
    loginEmailLabel: { en: 'Email Address', ar: 'البريد الإلكتروني' },
    loginPasswordLabel: { en: 'Password', ar: 'كلمة المرور' },
    loginDisabled: { en: 'Login (Disabled for Demo)', ar: 'تسجيل الدخول (معطّل للعرض)' },
    loginEmailPassword: { en: 'Enter your email and password', ar: 'أدخل بريدك الإلكتروني وكلمة المرور' },
    loginDemoHint: { en: 'Use the demo buttons on the left to sign in.', ar: 'استخدم أزرار العرض التجريبي للدخول.' },

    // --- Coach Dashboard ---
    coachDashTitle: { en: 'Coach Dashboard', ar: 'لوحة تحكم المدرب' },
    coachDashSubtitle: { en: 'Manage your clients and track progress.', ar: 'أدر عملاءك وتابع تقدمهم.' },
    totalClients: { en: 'Total Clients', ar: 'إجمالي العملاء' },
    needsReview: { en: 'Needs Review', ar: 'يحتاج مراجعة' },
    onboarding: { en: 'Onboarding', ar: 'تسجيل جديد' },
    addNewClient: { en: 'Add New Client', ar: 'إضافة عميل جديد' },
    clientName: { en: 'Client Name', ar: 'اسم العميل' },
    email: { en: 'Email', ar: 'البريد الإلكتروني' },
    category: { en: 'Category', ar: 'الفئة' },
    programLength: { en: 'Program Length', ar: 'مدة البرنامج' },
    weeks: { en: 'weeks', ar: 'أسابيع' },
    recentClients: { en: 'Recent Clients', ar: 'العملاء الأخيرون' },
    viewAll: { en: 'View All', ar: 'عرض الكل' },
    reviewCheckIn: { en: 'Review Check-In', ar: 'مراجعة التسجيل' },

    // --- Client Dashboard ---
    clientDashTitle: { en: 'My Dashboard', ar: 'لوحة التحكم' },
    yourTargets: { en: "This Week's Targets", ar: 'أهداف هذا الأسبوع' },
    highCarbDay: { en: 'HIGH CARB DAY', ar: 'يوم كربوهيدرات عالي' },
    lowCarbDay: { en: 'LOW CARB DAY', ar: 'يوم كربوهيدرات منخفض' },
    calories: { en: 'calories', ar: 'سعرات' },
    protein: { en: 'Protein', ar: 'بروتين' },
    carbs: { en: 'Carbs', ar: 'كربوهيدرات' },
    fats: { en: 'Fats', ar: 'دهون' },
    submitCheckIn: { en: 'Submit Check-In', ar: 'إرسال التسجيل' },
    currentWeight: { en: 'Current Weight', ar: 'الوزن الحالي' },
    weekProgress: { en: 'Week Progress', ar: 'تقدم الأسبوع' },
    programWeek: { en: 'Program Week', ar: 'أسبوع البرنامج' },
    pendingReview: { en: 'Pending Review', ar: 'بانتظار المراجعة' },
    waitingCoach: { en: "Waiting for coach's review and new targets.", ar: 'بانتظار مراجعة المدرب وأهداف جديدة.' },

    // Onboarding
    welcomeOnboarding: { en: 'Welcome! Let\'s get started', ar: 'مرحباً! لنبدأ' },
    onboardingSubtitle: { en: 'Please fill in your details so your coach can create your program.', ar: 'يرجى تعبئة بياناتك ليتمكن المدرب من إنشاء برنامجك.' },
    startingWeight: { en: 'Starting Weight (kg)', ar: 'الوزن الأولي (كجم)' },
    height: { en: 'Height (cm)', ar: 'الطول (سم)' },
    goal: { en: 'Primary Goal', ar: 'الهدف الرئيسي' },
    activityLevel: { en: 'Activity Level', ar: 'مستوى النشاط' },
    dietHistory: { en: 'Diet History', ar: 'تاريخ الحميات' },
    injuries: { en: 'Injuries / Limitations', ar: 'الإصابات / القيود' },
    submitIntake: { en: 'Submit Intake Form', ar: 'إرسال نموذج البيانات' },

    // --- Community Dashboard ---
    communityDashTitle: { en: 'Community Dashboard', ar: 'لوحة تحكم المجتمع' },
    communitySubtitle: { en: 'Welcome to the BioZackTeam community.', ar: 'مرحباً بك في مجتمع بيوزاك تيم.' },
    membershipCard: { en: 'Your Membership', ar: 'عضويتك' },
    communityMember: { en: 'Community Member', ar: 'عضو المجتمع' },
    accessFreeContent: { en: 'Access to free video content and community features.', ar: 'الوصول للمحتوى المجاني وميزات المجتمع.' },
    upgradeCoaching: { en: 'Upgrade to Coaching', ar: 'الترقية للتدريب' },
    quickActions: { en: 'Quick Actions', ar: 'إجراءات سريعة' },
    browseVideos: { en: 'Browse Videos', ar: 'تصفح الفيديو' },
    viewProfile: { en: 'View Profile', ar: 'عرض الملف الشخصي' },
    browseWorkouts: { en: 'Browse Workouts', ar: 'تصفح التمارين' },

    // --- Check-In Page ---
    checkInTitle: { en: 'Weekly Check-In', ar: 'التسجيل الأسبوعي' },
    checkInSubtitle: { en: 'Log your daily entries and submit for review.', ar: 'سجّل بياناتك اليومية وأرسلها للمراجعة.' },
    dailyEntries: { en: 'Daily Entries', ar: 'الإدخالات اليومية' },

    // ── Check-In wizard (step-by-step pending-week flow) ──
    checkInWizStepLabel:        { en: 'Step {n} of {total}',                ar: 'الخطوة {n} من {total}' },
    checkInWizContinue:         { en: 'Continue',                            ar: 'متابعة' },
    checkInWizBack:             { en: 'Back',                                ar: 'رجوع' },
    checkInWizSubmit:           { en: 'Submit week',                         ar: 'إرسال الأسبوع' },
    checkInWizSaveDraft:        { en: 'Save draft',                          ar: 'حفظ المسودة' },
    checkInWizCoachReferenceLabel: { en: 'From your coach',                  ar: 'من مدرّبك' },
    checkInWizCarbCyclingShort: { en: 'High: {highKcal} kcal · Low: {lowKcal} kcal',
                                  ar: 'عالي: {highKcal} سعرة · منخفض: {lowKcal} سعرة' },
    checkInWizReviewHeading:    { en: 'Review your week',                    ar: 'راجع أسبوعك' },
    checkInWizReviewEdit:       { en: 'Edit',                                ar: 'تعديل' },
    checkInWizSlidersLabel:     { en: 'How you felt',                        ar: 'كيف شعرت' },
    checkInWizDaysLoggedValue:  { en: '{n} / 7 days logged',                 ar: '{n} / 7 أيام مسجّلة' },
    checkInWizPhotosCountValue: { en: '{n} / 4 photos uploaded',             ar: '{n} / 4 صور مرفوعة' },
    checkInWizPhotosOptionalHint: { en: 'Photos are recommended but not required. Front, side, and back help your coach track progress; face is optional.',
                                  ar: 'الصور موصى بها وليست إلزامية. الأمامية والجانبية والخلفية تساعد مدرّبك على متابعة التقدّم؛ صورة الوجه اختيارية.' },

    // Step titles + one-line context shown under each
    checkInWizStepLogTitle:     { en: 'Your daily log',                      ar: 'سجلّك اليومي' },
    checkInWizStepLogHint:      { en: 'Enter your weight, macros, and cardio for each day of the week. Skip days you didn\'t track.',
                                  ar: 'أدخل وزنك، الماكروز، والكارديو لكل يوم من الأسبوع. اترك الأيام التي لم تُسجّل فيها.' },
    checkInWizStepFeltTitle:    { en: 'How you felt this week',              ar: 'كيف كان شعورك هذا الأسبوع' },
    checkInWizStepFeltHint:     { en: 'Rate your strength, hunger, and energy. Add your total cardio calories from any sessions outside the gym.',
                                  ar: 'قيّم قوّتك، جوعك، وطاقتك. أضف إجمالي سعرات الكارديو من أي جلسات خارج الصالة.' },
    checkInWizStepPhotosTitle:  { en: 'Progress photos',                     ar: 'صور التقدّم' },
    checkInWizStepPhotosHint:   { en: 'Same lighting, same time of day if possible. Front, side, and back are the most useful.',
                                  ar: 'نفس الإضاءة، ونفس الوقت من اليوم إن أمكن. الأمامية والجانبية والخلفية هي الأكثر فائدة.' },
    checkInWizStepReflectTitle: { en: 'Reflect & submit',                    ar: 'تأمّل وأرسل' },
    checkInWizStepReflectHint:  { en: 'Add a short note about how the week went so Coach Med has context. Then submit — your coach will reply within a few days.',
                                  ar: 'أضف ملاحظة قصيرة عن كيف سار الأسبوع ليكون لدى الكوتش ميد سياق. ثم أرسل — سيرد عليك مدرّبك خلال أيام قليلة.' },

    // Read-only versions of the step hints + titles
    checkInWizStepLogHintReadOnly:    { en: 'Here\'s the daily log you submitted this week. It\'s locked for editing.',
                                        ar: 'هذا هو سجلّك اليومي الذي أرسلته هذا الأسبوع. مغلق للتعديل.' },
    checkInWizStepFeltHintReadOnly:   { en: 'How you rated your strength, hunger, and energy this week.',
                                        ar: 'كيف قيّمت قوّتك، جوعك، وطاقتك هذا الأسبوع.' },
    checkInWizStepPhotosHintReadOnly: { en: 'The progress photos you uploaded this week. Tap any photo to view it full size.',
                                        ar: 'صور التقدّم التي رفعتها هذا الأسبوع. اضغط على أي صورة لعرضها بحجم كامل.' },
    checkInWizStepReflectTitleReadOnly: { en: 'Your reflection',                ar: 'تأمّلك' },
    checkInWizStepReflectHintReadOnly:  { en: 'The note you wrote for your coach this week — and the coach\'s feedback if they\'ve already reviewed.',
                                          ar: 'الملاحظة التي كتبتها لمدرّبك هذا الأسبوع — وملاحظات المدرّب إن كان قد راجع الأسبوع.' },
    checkInWizReviewHeadingReadOnly:    { en: 'What you logged this week',     ar: 'ما سجّلته هذا الأسبوع' },
    checkInWizReviewView:              { en: 'View',                            ar: 'عرض' },
    checkInWizNoReflectionFiled:        { en: 'You didn\'t leave a reflection this week.', ar: 'لم تكتب تأمّلاً هذا الأسبوع.' },
    checkInWizPhotoNotUploaded:         { en: 'not uploaded',                   ar: 'غير مرفوعة' },

    // ── Cardio calculator card (community update section) ──
    cardioCalcTitle:               { en: 'Plan your cardio',                    ar: 'خطّط للكارديو' },
    cardioCalcSubtitle:            { en: 'Pick a zone and we\'ll estimate how much you\'ll burn.',
                                     ar: 'اختر منطقة وسنقدّر كم ستحرق.' },
    cardioCalcMhrLabel:            { en: 'Your max heart rate',                 ar: 'أقصى معدّل لضربات قلبك' },
    cardioCalcMhrFormula:          { en: '220 − {age} years',                   ar: '220 − {age} سنة' },

    cardioCalcZoneFatTitle:        { en: 'Fat burn',                            ar: 'حرق الدهون' },
    cardioCalcZoneFatBody:         { en: 'Lower intensity, longer sessions. You can hold a conversation. Body uses more fat as fuel — best for weight loss and recovery.',
                                     ar: 'كثافة أقل، جلسات أطول. تستطيع التحدّث. الجسم يستخدم الدهون كوقود رئيسي — الأفضل لخسارة الوزن والتعافي.' },
    cardioCalcZoneHeartTitle:      { en: 'Train heart',                         ar: 'قوّ قلبك' },
    cardioCalcZoneHeartBody:       { en: 'Higher intensity, shorter sessions (HIIT). Hard breathing. Burns more total calories AND keeps burning hours after you stop.',
                                     ar: 'كثافة أعلى، جلسات أقصر (HIIT). تنفّس شاق. يحرق سعرات أكثر إجمالاً ويستمرّ في الحرق لساعات بعد التوقّف.' },
    cardioCalcSelect:              { en: 'Select',                              ar: 'اختر' },

    cardioCalcChangeZone:          { en: 'Change zone',                         ar: 'غيّر المنطقة' },
    cardioCalcDurationLabel:       { en: 'Session duration',                    ar: 'مدّة الجلسة' },
    cardioCalcEstimateLabel:       { en: 'You\'ll burn approximately',          ar: 'ستحرق تقريباً' },
    cardioCalcEstimateFootnote:    { en: 'Estimate based on a {weight} kg body weight. Real burn varies with effort, terrain, and individual metabolism.',
                                     ar: 'تقدير بناءً على وزن {weight} كغ. الحرق الفعلي يختلف حسب الجهد، الأرضية، والأيض الفردي.' },
    cardioCalcNotesLabel:          { en: 'Notes (optional)',                    ar: 'ملاحظات (اختياري)' },
    cardioCalcNotesPlaceholder:    { en: 'e.g. brisk walk on the treadmill, incline 5',
                                     ar: 'مثلاً: مشي سريع على المشاية، إنحدار 5' },
    cardioCalcSaveCta:             { en: 'Save to today\'s log',                ar: 'احفظ في سجل اليوم' },
    cardioCalcSavedConfirm:        { en: 'Saved to your log',                   ar: 'تم الحفظ في سجلّك' },
    cardioCalcAcademyCtaTitle:     { en: 'Want to learn more?',                 ar: 'تريد أن تتعلّم أكثر؟' },
    cardioCalcAcademyCtaSub:       { en: 'Watch the Cardio course in the Academy',
                                     ar: 'شاهد دورة الكارديو في الأكاديمية' },

    // ── Cardio Plan page (/cardio) ──
    cardioBackToDashboard:         { en: 'Back to dashboard',                   ar: 'العودة للوحة' },
    cardioPlanEyebrow:             { en: 'Cardio Hub',                          ar: 'مركز الكارديو' },
    cardioPlanTitle:               { en: 'Plan your cardio',                    ar: 'خطّط للكارديو' },
    cardioPlanSubtitle:            { en: 'Learn how to use cardio for fat loss or cardiovascular fitness — and pick the right machine, intensity, and duration for your goal.',
                                     ar: 'تعلّم كيف تستخدم الكارديو لخسارة الدهون أو لبناء اللياقة القلبية — واختر الآلة والكثافة والمدة المناسبة لهدفك.' },
    cardioPlanSubtitleV2:          { en: 'Pick an activity. We\'ll show how many calories you\'ll burn.',
                                     ar: 'اختر نشاطاً. سنوضّح لك كم ستحرق من السعرات.' },

    // ── Activity picker (simplified, no MHR/zones jargon) ──
    cardioPickActivityTitle:       { en: 'Pick your activity',                  ar: 'اختر نشاطك' },
    cardioPickActivityHint:        { en: 'Each tile shows what you\'d burn in 30 minutes at an easy pace.',
                                     ar: 'كل بطاقة تُظهر ما ستحرقه في 30 دقيقة بإيقاع سهل.' },
    cardioTileKcal30Min:           { en: 'kcal · 30 min',                       ar: 'سعرة · 30 دق' },

    cardioActTreadmill:            { en: 'Treadmill',                           ar: 'المشّاية' },
    cardioActBike:                 { en: 'Bike',                                ar: 'الدراجة' },
    cardioActElliptical:           { en: 'Elliptical',                          ar: 'الإليبتيكال' },
    cardioActRower:                { en: 'Rower',                               ar: 'التجديف' },
    cardioActStairs:               { en: 'Stair climber',                       ar: 'مصعد الدرج' },
    cardioActWalk:                 { en: 'Walking',                             ar: 'المشي' },
    cardioActJumprope:             { en: 'Jump rope',                           ar: 'حبل القفز' },
    cardioActSwim:                 { en: 'Swimming',                            ar: 'السباحة' },

    cardioPickedSubtitle:          { en: 'Adjust duration and intensity.',      ar: 'عدّل المدّة والكثافة.' },
    cardioHowLong:                 { en: 'How long?',                           ar: 'كم من الوقت؟' },
    cardioHowHard:                 { en: 'How hard?',                           ar: 'كم بشدّة؟' },

    cardioIntensityEasy:           { en: 'Easy',                                ar: 'سهل' },
    cardioIntensityEasyHint:       { en: 'You can hold a conversation.',        ar: 'تستطيع التحدّث.' },
    cardioIntensityHard:           { en: 'Hard',                                ar: 'صعب' },
    cardioIntensityHardHint:       { en: 'Short sentences only — pushing.',     ar: 'جمل قصيرة فقط — دفع شديد.' },

    // Treadmill incline slider (only renders when treadmill is picked)
    cardioInclineLabel:            { en: 'Incline',                             ar: 'الانحدار' },
    cardioInclineFlat:             { en: 'Flat',                                ar: 'مستوي' },

    cardioResultLabel:             { en: 'You\'ll burn approximately',          ar: 'ستحرق تقريباً' },
    cardioResultFootnote:          { en: 'A rough estimate. Real burn varies with effort, fitness level, and equipment resistance.',
                                     ar: 'تقدير تقريبي. الحرق الفعلي يختلف حسب الجهد، مستوى اللياقة، ومقاومة الجهاز.' },

    // Stats panel (age / height / weight) + weekly target
    cardioStatsLabel:              { en: 'Your stats',                          ar: 'بياناتك' },
    cardioStatsEdit:               { en: 'Edit',                                ar: 'تعديل' },
    cardioStatsHide:               { en: 'Hide',                                ar: 'إخفاء' },
    cardioStatAge:                 { en: 'Age',                                 ar: 'العمر' },
    cardioStatYears:               { en: 'yrs',                                 ar: 'سنة' },
    cardioStatHeight:              { en: 'Height',                              ar: 'الطول' },
    cardioStatWeight:              { en: 'Weight',                              ar: 'الوزن' },
    cardioStatsFootnote:           { en: 'At rest your body burns about {bmr} kcal per day just to keep you alive — cardio is on top of that.',
                                     ar: 'في الراحة، جسمك يحرق حوالي {bmr} سعرة يومياً فقط للحفاظ على حياتك — الكارديو يُضاف لهذا.' },

    cardioTargetEyebrow:           { en: 'Your weekly target',                  ar: 'هدفك الأسبوعي' },
    cardioTargetTitle:             { en: 'Aim for {min} minutes of cardio per week',
                                     ar: 'استهدف {min} دقيقة من الكارديو أسبوعياً' },
    cardioTargetBody:              { en: 'At your weight, that\'s about {kcal} kcal burned per week. Split it across 3-5 sessions.',
                                     ar: 'بوزنك، يعني ذلك حوالي {kcal} سعرة محروقة أسبوعياً. وزّعها على 3-5 جلسات.' },

    cardioPlanLogNoteTitle:        { en: 'Logging happens on the Update page',  ar: 'التسجيل يتمّ في صفحة التحديث' },
    cardioPlanLogNoteBody:         { en: 'This page is for planning and learning. To record what you actually did, open Update and add it to your weekly check-in.',
                                     ar: 'هذه الصفحة للتخطيط والتعلّم. لتسجيل ما قمت به فعلياً، افتح صفحة التحديث وأضفه إلى تسجيلك الأسبوعي.' },

    cardioSection1Title:           { en: 'Your numbers',                        ar: 'أرقامك' },
    cardioSection1Hint:            { en: 'Everything below this page is calibrated to your max heart rate and body weight.',
                                     ar: 'كل ما يلي في هذه الصفحة معاير وفق أقصى معدّل لضربات قلبك ووزنك.' },
    cardioSection1Footnote:        { en: 'Max heart rate is a rough ceiling — most adults max out within 10-15 bpm of this number. If you have a heart-rate monitor and your real max differs, use that.',
                                     ar: 'أقصى معدّل ضربات القلب هو سقف تقريبي — معظم البالغين يصلون لذروتهم في حدود 10-15 نبضة من هذا الرقم. إذا كان لديك جهاز قياس واختلف القياس الفعلي، استخدم ذلك.' },
    cardioMhrLabel:                { en: 'Max heart rate',                      ar: 'أقصى معدّل لضربات القلب' },
    cardioMhrFormula:              { en: '220 − {age}',                         ar: '220 − {age}' },
    cardioYourWeight:              { en: 'Your weight',                         ar: 'وزنك' },
    cardioWeightSub:               { en: 'Used in the calorie estimate',        ar: 'يُستخدم في تقدير السعرات' },
    cardioFormula:                 { en: 'Formula',                             ar: 'الصيغة' },
    cardioFormulaSub:              { en: 'Standard MHR estimate',               ar: 'تقدير قياسي لأقصى نبضات القلب' },

    cardioSection2Title:           { en: 'Pick your goal',                      ar: 'اختر هدفك' },
    cardioSection2Hint:            { en: 'Two zones, very different intents. Pick the one that matches what you want this session to do.',
                                     ar: 'منطقتان، بنوايا مختلفة جداً. اختر التي تطابق ما تريد أن تحقّقه في هذه الجلسة.' },

    cardioZoneFatTitle:            { en: 'Fat burn',                            ar: 'حرق الدهون' },
    cardioZoneFatLong:             { en: 'Lower intensity, longer sessions. You can hold a conversation. The body uses a higher percentage of fat as fuel — best for weight loss, recovery cardio, and building an aerobic base.',
                                     ar: 'كثافة أقل، جلسات أطول. تستطيع التحدّث. الجسم يستخدم نسبة أعلى من الدهون كوقود — الأفضل لخسارة الوزن، الكارديو التعافي، وبناء قاعدة هوائية.' },
    cardioZoneFatBullet1:          { en: '60-70% of your max heart rate',       ar: '60-70% من أقصى معدّل ضربات قلبك' },
    cardioZoneFatBullet2:          { en: 'Conversational pace — you can speak in full sentences',
                                     ar: 'إيقاع محادثة — تستطيع الكلام بجمل كاملة' },
    cardioZoneFatBullet3:          { en: 'Best done 3-5 times per week, 30-60 min per session',
                                     ar: 'الأفضل ممارستها 3-5 مرات أسبوعياً، 30-60 دقيقة لكل جلسة' },

    cardioZoneHeartTitle:          { en: 'Train heart',                         ar: 'قوّ قلبك' },
    cardioZoneHeartLong:           { en: 'Higher intensity, shorter sessions (HIIT-style). Hard breathing. Burns more total calories AND keeps burning for hours after you stop (EPOC). Best for cardiovascular fitness and time-efficient calorie burn.',
                                     ar: 'كثافة أعلى، جلسات أقصر (نمط HIIT). تنفّس شاق. يحرق سعرات أكثر إجمالاً ويستمرّ في الحرق لساعات بعد التوقّف (EPOC). الأفضل للياقة القلبية وحرق السعرات بكفاءة زمنية.' },
    cardioZoneHeartBullet1:        { en: '70-90% of your max heart rate',       ar: '70-90% من أقصى معدّل ضربات قلبك' },
    cardioZoneHeartBullet2:        { en: 'Hard effort — short sentences only',  ar: 'مجهود صعب — جمل قصيرة فقط' },
    cardioZoneHeartBullet3:        { en: 'Best done 2-3 times per week, 10-30 min with intervals',
                                     ar: 'الأفضل ممارستها 2-3 مرات أسبوعياً، 10-30 دقيقة مع فترات راحة' },
    cardioZonePickedLabel:         { en: 'Selected',                            ar: 'مُختارة' },

    cardioSection3Title:           { en: 'Pick your machine',                   ar: 'اختر الآلة' },
    cardioSection3Hint:            { en: 'Not all cardio is equal. Here\'s how much you\'ll burn on common machines and outdoor options at your {zone} intensity.',
                                     ar: 'ليست كل أنواع الكارديو متساوية. إليك كم ستحرق على الآلات الشائعة والخيارات الخارجية بكثافة {zone}.' },
    cardioSection3Footnote:        { en: 'Estimates use your body weight of {weight} kg and average MET values. Real burn varies with effort, resistance, terrain, and individual metabolism.',
                                     ar: 'التقديرات تستخدم وزنك {weight} كغ وقيم MET متوسطة. الحرق الفعلي يختلف حسب الجهد، المقاومة، الأرضية، والأيض الفردي.' },
    cardioDurationLabel:           { en: 'Session duration',                    ar: 'مدّة الجلسة' },
    cardioPerMinLabel:             { en: 'Rate',                                ar: 'المعدّل' },

    // Machine names + 1-line descriptions
    cardioMachTreadmill:           { en: 'Treadmill (jog/run)',                 ar: 'المشّاية (هرولة / جري)' },
    cardioMachTreadmillDesc:       { en: 'Even pace on a flat or inclined deck.', ar: 'إيقاع ثابت على سطح مستوٍ أو مائل.' },
    cardioMachBike:                { en: 'Stationary bike',                     ar: 'الدراجة الثابتة' },
    cardioMachBikeDesc:            { en: 'Upright or recumbent — low joint impact.',
                                     ar: 'منتصبة أو ظهرية — تأثير منخفض على المفاصل.' },
    cardioMachElliptical:          { en: 'Elliptical',                          ar: 'الإليبتيكال' },
    cardioMachEllipticalDesc:      { en: 'Smooth, low-impact, full-body engagement.',
                                     ar: 'سلسة، تأثير منخفض، تشغيل لكامل الجسم.' },
    cardioMachRower:               { en: 'Rowing machine',                      ar: 'آلة التجديف' },
    cardioMachRowerDesc:           { en: 'Full-body pull — strength + cardio combined.',
                                     ar: 'سحب لكامل الجسم — قوّة وكارديو معاً.' },
    cardioMachStairs:              { en: 'Stair climber',                       ar: 'مصعد الدرج' },
    cardioMachStairsDesc:          { en: 'Big calorie burn for legs + glutes.',  ar: 'حرق سعرات كبير للساقين والمؤخّرة.' },
    cardioMachWalk:                { en: 'Walking (outside)',                   ar: 'المشي (خارجاً)' },
    cardioMachWalkDesc:            { en: 'Accessible everywhere — easy daily option.',
                                     ar: 'متاح في كل مكان — خيار يومي سهل.' },
    cardioMachJumprope:            { en: 'Jump rope',                           ar: 'حبل القفز' },
    cardioMachJumpropeDesc:        { en: 'High burn per minute — needs technique.',
                                     ar: 'حرق عالٍ لكل دقيقة — يتطلّب تقنية.' },
    cardioMachSwim:                { en: 'Swimming',                            ar: 'السباحة' },
    cardioMachSwimDesc:            { en: 'Zero joint impact — full-body workout.',
                                     ar: 'بدون أي تأثير على المفاصل — تمرين لكامل الجسم.' },

    cardioSection4Title:           { en: 'Your target at a glance',             ar: 'هدفك بنظرة واحدة' },
    cardioSection4Hint:            { en: 'Aim to keep your heart rate in this band for the duration above. Use a chest strap, watch, or RPE if you don\'t have a monitor.',
                                     ar: 'حافظ على نبضات قلبك في هذا النطاق طوال المدة أعلاه. استخدم حزام صدري، ساعة، أو تقييم الجهد الذاتي إن لم يكن لديك جهاز قياس.' },
    cardioTargetHrLabel:           { en: 'Target heart rate band',              ar: 'نطاق نبضات القلب المستهدف' },
    cardioPickedZoneLabel:         { en: 'Zone',                                ar: 'المنطقة' },
    cardioPickedDurationLabel:     { en: 'Duration',                            ar: 'المدّة' },

    cardioAcademyCtaTitle:         { en: 'Want the full deep-dive?',            ar: 'تريد الشرح الكامل؟' },
    cardioAcademyCtaSub:           { en: 'Watch the Cardio course in the Academy →',
                                     ar: 'شاهد دورة الكارديو في الأكاديمية ←' },

    // Dashboard trailer (full hero-card matching workout + diet cards)
    cardioTrailerEyebrow:          { en: 'Your cardio plan',                    ar: 'خطّة الكارديو' },
    cardioTrailerTitle:            { en: 'Plan your cardio',                    ar: 'خطّط للكارديو' },
    cardioTrailerPurpose:          { en: 'Zones, machines, calculator',         ar: 'مناطق، آلات، حاسبة' },
    cardioTrailerSub:              { en: 'Pick your goal, pick your machine, see how much you\'ll burn.',
                                     ar: 'اختر هدفك، اختر آلتك، شاهد كم ستحرق.' },
    cardioTrailerMhrPill:          { en: 'Max HR {mhr}',                        ar: 'أقصى {mhr}' },
    cardioTrailerCta:              { en: 'Open my plan',                        ar: 'افتح خطّتي' },

    // ── Celebration messages after logging ──
    selfLogCongratsTitle:          { en: 'You\'re logged in for today.',        ar: 'تم تسجيلك لهذا اليوم.' },
    selfLogCongratsBody:           { en: 'Nice work. Keep the momentum — log again on your next training day.',
                                     ar: 'عمل جيد. حافظ على الزخم — سجّل مرة أخرى في يوم تدريبك القادم.' },
    progressLogCongratsTitle:      { en: 'Metrics logged. Strong work.',         ar: 'تم تسجيل القياسات. عمل قوي.' },
    progressLogCongratsBody:       { en: 'Your weekly numbers are in. Keep the streak alive — see you next week.',
                                     ar: 'أرقامك الأسبوعية مسجّلة. حافظ على السلسلة — نراك الأسبوع القادم.' },

    // Shared completion-celebration CTAs (workout day / progress / check-in)
    celebrationBackToDashboard:    { en: 'Back to Dashboard',                    ar: 'العودة للوحة' },
    celebrationReviewWeek:         { en: 'Review my submitted week',             ar: 'مراجعة الأسبوع المُرسَل' },
    celebrationReviewProgress:     { en: 'Stay and review my progress',          ar: 'البقاء ومراجعة تقدّمي' },
    celebrationStayHere:           { en: 'Stay on this page',                    ar: 'البقاء في هذه الصفحة' },
    checkInCongratsTitle:          { en: 'Week submitted. Excellent work.',     ar: 'تم إرسال الأسبوع. عمل ممتاز.' },
    checkInCongratsBody:           { en: 'Your coach will review and reply within a few days. See you next week.',
                                     ar: 'سيراجع مدرّبك ويردّ خلال بضعة أيام. نراك الأسبوع القادم.' },

    // Step titles for the progress-indicator chip (short variants)
    checkInWizSteplogTitle:     { en: 'Daily log',                           ar: 'سجلّ يومي' },
    checkInWizStepfeltTitle:    { en: 'How you felt',                        ar: 'كيف شعرت' },
    checkInWizStepphotosTitle:  { en: 'Photos',                              ar: 'الصور' },
    checkInWizStepreflectTitle: { en: 'Reflect',                             ar: 'تأمّل' },
    weeklySummary: { en: 'Weekly Summary', ar: 'ملخص الأسبوع' },
    hungerScale: { en: 'Hunger Scale (1-10)', ar: 'مقياس الجوع (1-10)' },
    howDidYouFeel: { en: 'How was your week overall?', ar: 'كيف كان أسبوعك بشكل عام؟' },
    weight: { en: 'Weight', ar: 'الوزن' },
    day: { en: 'Day', ar: 'اليوم' },
    photos: { en: 'Photos', ar: 'الصور' },

    // --- Daily Tracking Table ---
    calculatedCalories: { en: 'Cal', ar: 'سعرة' },

    // --- Coach Review ---
    coachReviewTitle: { en: 'Client Review', ar: 'مراجعة العميل' },
    coachFeedback: { en: 'Coach Feedback', ar: 'ملاحظات المدرب' },
    adjustTargets: { en: 'Adjust Targets', ar: 'تعديل الأهداف' },
    applyTargets: { en: 'Apply & Set New Targets', ar: 'تطبيق وتحديد أهداف جديدة' },
    createProgram: { en: 'Create Program', ar: 'إنشاء برنامج' },
    weeklyOverview: { en: 'Weekly Overview', ar: 'نظرة عامة أسبوعية' },
    markReviewed: { en: 'Mark as Reviewed', ar: 'تحديد كمراجع' },
    setInitialTargets: { en: 'Set Initial Targets', ar: 'تحديد الأهداف الأولية' },

    // --- Video Library / Academy (branded "University" in the menu,
    //     "BioZackTeam University" on the page) ---
    videoLibraryTitle: { en: 'BioZackTeam University', ar: 'أكاديمية بيوزاك تيم' },
    videoLibrarySubtitle: { en: 'Exclusive training and nutrition content.', ar: 'محتوى حصري للتدريب والتغذية.' },
    searchVideos: { en: 'Search videos...', ar: 'بحث في الفيديو...' },
    addVideo: { en: 'Add Video', ar: 'إضافة فيديو' },
    addCategory: { en: 'Category', ar: 'فئة' },
    watchNow: { en: 'Watch Now', ar: 'شاهد الآن' },
    upgradeToUnlock: { en: 'Upgrade to Unlock', ar: 'ترقية للفتح' },
    videoTitle: { en: 'Video Title', ar: 'عنوان الفيديو' },
    videoUrl: { en: 'Video URL (YouTube or Vimeo)', ar: 'رابط الفيديو (يوتيوب أو فيميو)' },
    thumbnailUrl: { en: 'Thumbnail URL', ar: 'رابط الصورة المصغرة' },
    description: { en: 'Description', ar: 'الوصف' },
    lockForClients: { en: 'Lock for Coaching Clients Only', ar: 'قفل لعملاء التدريب فقط' },
    addNewVideo: { en: 'Add New Video', ar: 'إضافة فيديو جديد' },
    addNewCategory: { en: 'Add New Category', ar: 'إضافة فئة جديدة' },
    categoryName: { en: 'Category Name', ar: 'اسم الفئة' },
    existingCategories: { en: 'Existing categories:', ar: 'الفئات الموجودة:' },
    selectCategory: { en: 'Select a category', ar: 'اختر فئة' },
    detectedPlatform: { en: 'Detected platform:', ar: 'المنصة المكتشفة:' },

    // --- Workouts ---
    workoutsTitle: { en: 'Workouts', ar: 'التمارين' },
    workoutsCoachSubtitle: { en: 'Create and manage workout routines for your clients.', ar: 'أنشئ وأدر برامج التمرين لعملائك.' },
    workoutsClientSubtitle: { en: 'Browse workout routines designed by your coach.', ar: 'تصفح برامج التمرين المصممة من مدربك.' },
    searchWorkouts: { en: 'Search workouts...', ar: 'بحث في التمارين...' },
    newWorkout: { en: 'New Workout', ar: 'تمرين جديد' },
    workoutName: { en: 'Workout Name', ar: 'اسم التمرين' },
    splitType: { en: 'Split Type', ar: 'نوع التقسيم' },
    exercises: { en: 'exercises', ar: 'تمارين' },
    totalSets: { en: 'total sets', ar: 'مجموعات' },
    sets: { en: 'Sets', ar: 'مجموعات' },
    reps: { en: 'Reps', ar: 'تكرارات' },
    rest: { en: 'Rest', ar: 'راحة' },
    notes: { en: 'Notes', ar: 'ملاحظات' },
    exercise: { en: 'Exercise', ar: 'تمرين' },
    addExercise: { en: 'Add Exercise', ar: 'إضافة تمرين' },
    duration: { en: 'Duration (min)', ar: 'المدة (دقيقة)' },
    createWorkout: { en: 'Create Workout', ar: 'إنشاء التمرين' },
    saveChanges: { en: 'Save Changes', ar: 'حفظ التغييرات' },
    editWorkout: { en: 'Edit Workout', ar: 'تعديل التمرين' },
    noWorkoutsFound: { en: 'No workouts found', ar: 'لم يتم العثور على تمارين' },
    noWorkoutsCoachHint: { en: 'Create your first workout routine above.', ar: 'أنشئ أول برنامج تمرين من الأعلى.' },
    noWorkoutsClientHint: { en: "Your coach hasn't added any workouts matching your filters yet.", ar: 'لم يضف مدربك أي تمارين تطابق الفلاتر بعد.' },
    addSplitType: { en: 'Add Split Type', ar: 'إضافة نوع تقسيم' },
    splitTypeName: { en: 'Split Type Name', ar: 'اسم نوع التقسيم' },
    existing: { en: 'Existing:', ar: 'الموجود:' },

    // Goals
    allGoals: { en: 'All Goals', ar: 'كل الأهداف' },
    goalFatLoss: { en: 'Fat Loss', ar: 'حرق الدهون' },
    goalMuscleGain: { en: 'Muscle Gain', ar: 'بناء العضلات' },
    goalStrength: { en: 'Strength', ar: 'القوة' },
    goalRecomp: { en: 'Recomp', ar: 'إعادة التكوين' },
    goalMaintenance: { en: 'Maintenance', ar: 'الثبات' },
    goalEndurance: { en: 'Endurance', ar: 'التحمل' },

    // --- Clients Page ---
    clientsTitle: { en: 'Client Management', ar: 'إدارة العملاء' },
    clientsSubtitle: { en: 'Manage your roster, assign programs, and control access.', ar: 'أدر قائمتك، حدد البرامج، وتحكم بالوصول.' },
    searchClients: { en: 'Search clients...', ar: 'بحث في العملاء...' },
    addClient: { en: 'Add Client', ar: 'إضافة عميل' },
    allClients: { en: 'All Clients', ar: 'كل العملاء' },
    onTrack: { en: 'On Track', ar: 'على المسار' },
    changeCategory: { en: 'Change Category', ar: 'تغيير الفئة' },
    changeCategoryFor: { en: 'Change program category for', ar: 'تغيير فئة البرنامج لـ' },
    removeClient: { en: 'Remove Client', ar: 'حذف العميل' },

    // Categories
    cutting: { en: 'Cutting', ar: 'تنشيف' },
    bulking: { en: 'Bulking', ar: 'تضخيم' },
    pro: { en: 'Pro', ar: 'محترف' },
    health: { en: 'Health', ar: 'صحة' },

    // --- Profile ---
    profileTitle: { en: 'Update', ar: 'التحديث' },
    accountInfo: { en: 'Account Information', ar: 'معلومات الحساب' },
    name: { en: 'Name', ar: 'الاسم' },
    role: { en: 'Role', ar: 'الدور' },
    memberSince: { en: 'Member since', ar: 'عضو منذ' },
    january2025: { en: 'January 2025', ar: 'يناير 2025' },
    preferences: { en: 'Preferences', ar: 'التفضيلات' },

    // --- Language ---
    language: { en: 'Language', ar: 'اللغة' },
    english: { en: 'English', ar: 'إنجليزي' },
    arabic: { en: 'العربية', ar: 'العربية' },

    // --- Client Onboarding ---
    welcomeClient: { en: 'Welcome,', ar: 'مرحباً,' },
    completeIntake: { en: 'Complete this intake form to get started with your coaching program.', ar: 'أكمل هذا النموذج للبدء في برنامج التدريب.' },
    baseMeasurements: { en: 'Base Measurements', ar: 'القياسات الأساسية' },
    weightKg: { en: 'Weight (kg)', ar: 'الوزن (كجم)' },
    heightCm: { en: 'Height (cm)', ar: 'الطول (سم)' },
    physiqueDocumentation: { en: 'Physique Documentation', ar: 'توثيق الجسم' },
    uploadPhotos: { en: 'Upload front, side, and back photos in good lighting.', ar: 'ارفع صور أمامية وجانبية وخلفية بإضاءة جيدة.' },
    front: { en: 'Front', ar: 'أمامي' },
    side: { en: 'Side', ar: 'جانبي' },
    back: { en: 'Back', ar: 'خلفي' },
    noFileChosen: { en: 'No file chosen', ar: 'لم يتم اختيار ملف' },
    currentNutrition: { en: 'Current Nutrition', ar: 'التغذية الحالية' },
    nutritionPlaceholder: { en: "Describe your current eating habits, any diets you've tried...", ar: 'صف عاداتك الغذائية الحالية وأي حميات جربتها...' },
    primaryObjectives: { en: 'Primary Objectives', ar: 'الأهداف الرئيسية' },
    objFatLoss: { en: 'Fat Loss', ar: 'حرق الدهون' },
    objFatLossDesc: { en: 'Shed body fat while maintaining muscle.', ar: 'حرق الدهون مع الحفاظ على العضلات.' },
    objMuscleGain: { en: 'Muscle Gain', ar: 'بناء العضلات' },
    objMuscleGainDesc: { en: 'Build lean muscle mass.', ar: 'بناء كتلة عضلية صافية.' },
    objRecomp: { en: 'Recomposition', ar: 'إعادة التكوين' },
    objRecompDesc: { en: 'Lose fat and build muscle.', ar: 'حرق الدهون وبناء العضلات.' },
    objPerformance: { en: 'Performance', ar: 'الأداء' },
    objPerformanceDesc: { en: 'Focus on strength.', ar: 'التركيز على القوة.' },
    coachWillReview: { en: 'Your coach will review this and build your Week 1 plan.', ar: 'سيراجع مدربك هذا ويبني خطة الأسبوع الأول.' },
    fillRequired: { en: 'Please fill in all required fields (Weight and Height).', ar: 'يرجى تعبئة جميع الحقول المطلوبة (الوزن والطول).' },

    // --- Client Pending State ---
    allSetTitle: { en: "You're All Set!", ar: 'تم التسجيل بنجاح!' },
    intakeReceived: { en: "We've received your intake form.", ar: 'تم استلام نموذج البيانات.' },
    coachBuilding: { en: 'Your coach is building your personalized Week 1-12 program.', ar: 'مدربك يقوم ببناء برنامجك المخصص من الأسبوع 1-12.' },
    statusPendingReview: { en: 'Status: Pending Coach Review', ar: 'الحالة: بانتظار مراجعة المدرب' },

    // --- Client Active Dashboard ---
    welcomeBack: { en: 'Welcome back,', ar: 'مرحباً مجدداً,' },
    weekOverview: { en: "Here's your coaching overview for this week.", ar: 'إليك نظرة عامة على تدريبك هذا الأسبوع.' },
    phase: { en: 'Phase', ar: 'المرحلة' },
    latestWeight: { en: 'Latest Weight', ar: 'آخر وزن' },
    status: { en: 'Status', ar: 'الحالة' },
    active: { en: 'Active', ar: 'نشط' },
    checkIn: { en: 'Check-In', ar: 'التسجيل' },
    dueSunday: { en: 'Due Sunday', ar: 'مطلوب الأحد' },
    submitted: { en: 'Submitted', ar: 'تم الإرسال' },
    latestCoachFeedback: { en: 'Latest Coach Feedback', ar: 'آخر ملاحظات المدرب' },
    fromWeek: { en: 'From Week', ar: 'من الأسبوع' },
    updateDailyTracking: { en: 'Update Daily Tracking', ar: 'تحديث التتبع اليومي' },
    viewCheckIn: { en: 'View Check-In', ar: 'عرض التسجيل' },
    watchCourses: { en: 'Watch Courses', ar: 'مشاهدة الدورات' },

    // --- Check-In Page ---
    pending: { en: 'Pending', ar: 'معلق' },
    reviewed: { en: 'Reviewed', ar: 'تمت المراجعة' },
    saveProgress: { en: 'Save Progress', ar: 'حفظ التقدم' },
    submitToCoach: { en: 'Submit to Coach', ar: 'إرسال للمدرب' },
    progressSaved: { en: 'Progress saved!', ar: 'تم حفظ التقدم!' },
    checkInSubmitted: { en: 'Check-in submitted to coach!', ar: 'تم إرسال التسجيل للمدرب!' },
    weeklyReflection: { en: 'Weekly Reflection', ar: 'تأملات الأسبوع' },
    weeklyReflectionPlaceholder: { en: 'How did you feel this week? Any challenges or wins?', ar: 'كيف شعرت هذا الأسبوع؟ هل واجهت تحديات أو حققت إنجازات؟' },
    progressPhotos: { en: 'Progress Photos', ar: 'صور التقدم' },
    uploadProgressPhotos: { en: 'Upload front, side, and back progress photos', ar: 'ارفع صور تقدم أمامية وجانبية وخلفية' },
    currentTargets: { en: 'Current Targets', ar: 'الأهداف الحالية' },

    // --- Coach Review Page ---
    backToClients: { en: 'Back to clients', ar: 'العودة للعملاء' },
    clientNotFound: { en: 'Client not found.', ar: 'العميل غير موجود.' },
    programCreation: { en: 'Program Creation', ar: 'إنشاء البرنامج' },
    reviewWeek: { en: 'Review Week', ar: 'مراجعة الأسبوع' },
    noEntries: { en: 'No entries submitted yet.', ar: 'لم يتم إرسال إدخالات بعد.' },
    clientSummary: { en: 'Client Summary', ar: 'ملخص العميل' },
    writeYourFeedback: { en: 'Write your feedback for the client...', ar: 'اكتب ملاحظاتك للعميل...' },
    changeTargetsQuestion: { en: 'Adjust macro targets for upcoming weeks?', ar: 'تعديل أهداف السعرات للأسابيع القادمة؟' },
    highCarb: { en: 'High Carb', ar: 'كربوهيدرات عالي' },
    lowCarb: { en: 'Low Carb', ar: 'كربوهيدرات منخفض' },
    loading: { en: 'Loading...', ar: 'جارٍ التحميل...' },
    weekData: { en: 'Week data not found.', ar: 'بيانات الأسبوع غير موجودة.' },
    clientRecord: { en: 'Client record not found.', ar: 'سجل العميل غير موجود.' },
    actionRequired: { en: 'Action Required', ar: 'إجراء مطلوب' },
    checkInSubmittedLabel: { en: 'check-in submitted', ar: 'تم إرسال التسجيل' },
    createClient: { en: 'Create Client', ar: 'إنشاء عميل' },
    programType: { en: 'Program Type', ar: 'نوع البرنامج' },

    // --- ToS modal ---
    tosTitle: { en: 'Before you continue', ar: 'قبل المتابعة' },
    tosBody: { en: 'By using BioZackTeam Academy, you agree NOT to share, redistribute, screen-record, or copy any video content, PDF, or coaching material. Your email is watermarked on all videos. Violations result in immediate account termination without refund.', ar: 'باستخدامك أكاديمية بيوزاك تيم، أنت توافق على عدم مشاركة أو إعادة توزيع أو تسجيل أو نسخ أي مقطع فيديو أو ملف PDF أو محتوى تدريبي. بريدك الإلكتروني يظهر كعلامة مائية على جميع الفيديوهات. أي مخالفة تؤدي إلى إغلاق الحساب فورًا دون استرداد.' },
    tosLead: { en: 'By signing in, you agree to the BioZackTeam terms below.', ar: 'بتسجيل الدخول، أنت توافق على الشروط التالية لبيوزاك تيم.' },
    tosForbidShare: { en: 'Do not share or forward videos.', ar: 'لا تشارك أو تعيد توجيه الفيديوهات.' },
    tosForbidRecord: { en: 'Do not screen-record any session or lesson.', ar: 'لا تسجّل أي جلسة أو درس عبر الشاشة.' },
    tosForbidRedistribute: { en: 'Do not copy, repost, or resell PDFs and coaching materials.', ar: 'لا تنسخ أو تعيد نشر أو تبيع ملفات PDF ومحتوى التدريب.' },
    tosWatermarkNote: { en: 'Your email is watermarked on every video. Leaks are traceable.', ar: 'بريدك الإلكتروني يظهر كعلامة مائية على كل فيديو. التسريبات قابلة للتتبع.' },
    tosConsequenceNote: { en: 'Violations result in immediate account termination, no refund.', ar: 'أي مخالفة تؤدي إلى إغلاق الحساب فوراً دون استرداد.' },
    tosAgreeCheckbox: { en: 'I have read and accept the terms.', ar: 'لقد قرأت ووافقت على الشروط.' },
    tosAcceptCta: { en: 'Accept and continue', ar: 'قبول والمتابعة' },
    sessionExpired: { en: 'Your session expired. Please sign in again.', ar: 'انتهت جلستك. الرجاء تسجيل الدخول مرة أخرى.' },
    // --- Coach cockpit + nav cleanup ---
    attentionQueue: { en: 'Attention queue', ar: 'قائمة الانتباه' },
    needsReviewSegment: { en: 'Needs Review', ar: 'بانتظار المراجعة' },
    missedThisWeek: { en: 'Missed', ar: 'تخلّف' },
    stale: { en: 'Stale', ar: 'غير نشط' },
    joinDiscord: { en: 'Join our Discord', ar: 'انضم إلى ديسكورد' },
    discordDesc: { en: 'Live chat with the team and other members.', ar: 'دردشة مباشرة مع الفريق والأعضاء.' },

    // --- Sidebar nav (extra) ---
    navCommunity: { en: 'Community', ar: 'المجتمع' },
    navMessages: { en: 'Messages', ar: 'الرسائل' },
    navSettings: { en: 'Profile & Settings', ar: 'الملف والإعدادات' },
    navLeaderboard: { en: 'Leaderboard', ar: 'لوحة المتصدرين' },

    // --- Login + Auth ---
    signInButton: { en: 'Sign In', ar: 'تسجيل الدخول' },
    signInCredentials: { en: 'Enter your email and password to continue.', ar: 'أدخل بريدك وكلمة المرور للمتابعة.' },
    forgotPassword: { en: 'Forgot password?', ar: 'نسيت كلمة المرور؟' },
    resetPassword: { en: 'Reset password', ar: 'إعادة تعيين كلمة المرور' },
    resetPasswordDesc: { en: 'Enter your email and we will send you a reset link.', ar: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.' },
    sendResetLink: { en: 'Send reset link', ar: 'إرسال رابط الإعادة' },
    resetEmailSent: { en: 'If that email exists, a reset link has been sent.', ar: 'إذا كان البريد موجوداً، تم إرسال رابط الإعادة.' },
    backToSignIn: { en: 'Back to sign in', ar: 'العودة لتسجيل الدخول' },
    noAccount: { en: 'No account?', ar: 'ليس لديك حساب؟' },
    lookingForCoach: { en: 'Looking for a coach?', ar: 'تبحث عن مدرب؟' },
    minSixChars: { en: 'At least 6 characters', ar: '٦ أحرف على الأقل' },
    userNotFound: { en: 'User not found.', ar: 'المستخدم غير موجود.' },
    invalidWeight: { en: 'Please enter a valid weight.', ar: 'الرجاء إدخال وزن صحيح.' },

    // --- Common feedback / errors ---
    error: { en: 'Error', ar: 'خطأ' },
    success: { en: 'Success', ar: 'تم بنجاح' },
    actionFailed: { en: 'Action failed. Please try again.', ar: 'فشلت العملية. حاول مرة أخرى.' },
    failedToSave: { en: 'Failed to save.', ar: 'فشل الحفظ.' },
    submissionFailed: { en: 'Submission failed. Please try again.', ar: 'فشل الإرسال. حاول مرة أخرى.' },
    permissionDeniedSubmit: { en: "Permission denied. You can't submit this.", ar: 'ليس لديك صلاحية لإرسال هذا.' },
    photoUploadFailed: { en: 'Photo upload failed.', ar: 'فشل رفع الصورة.' },
    photoUploadUnauthorized: { en: 'Photo upload not authorized for this account.', ar: 'لا يُسمح لهذا الحساب برفع الصور.' },
    photosRequired: { en: 'Progress photos are required to submit.', ar: 'صور التقدم مطلوبة للإرسال.' },
    noPhotosDuringOnboarding: { en: 'You can skip photos during onboarding.', ar: 'يمكنك تخطي الصور خلال التسجيل.' },
    confirmDelete: { en: 'Confirm delete', ar: 'تأكيد الحذف' },
    confirmRemove: { en: 'Confirm remove', ar: 'تأكيد الإزالة' },
    creating: { en: 'Creating...', ar: 'جارٍ الإنشاء...' },
    deleting: { en: 'Deleting...', ar: 'جارٍ الحذف...' },
    loadingEllipsis: { en: 'Loading...', ar: 'جارٍ التحميل...' },
    enterName: { en: 'Enter name', ar: 'أدخل الاسم' },

    // --- Units ---
    kcalUnit: { en: 'kcal', ar: 'سعرة' },
    kgUnit: { en: 'kg', ar: 'كجم' },
    daysUnit: { en: 'days', ar: 'أيام' },
    xpUnit: { en: 'XP', ar: 'نقطة' },
    yearsOld: { en: 'years old', ar: 'سنة' },
    measurementsCm: { en: 'Measurements (cm)', ar: 'القياسات (سم)' },

    // --- Cardio target ---
    cardioTargetLabel: { en: 'Cardio target', ar: 'هدف الكارديو' },
    cardioTargetHint: { en: 'Weekly cardio calories the client should burn.', ar: 'سعرات الكارديو الأسبوعية المطلوبة.' },
    cardioCalories: { en: 'Cardio calories', ar: 'سعرات الكارديو' },
    progressOverview: { en: 'Progress overview', ar: 'نظرة عامة على التقدم' },
    progressOverviewSub: {
        en: 'Weight (kg) + weekly wellbeing scales (1–10).',
        ar: 'الوزن (كجم) + مقاييس الصحة الأسبوعية (1–10).'
    },
    strength: { en: 'Strength', ar: 'القوة' },
    hunger: { en: 'Hunger', ar: 'الجوع' },
    energy: { en: 'Energy', ar: 'الطاقة' },

    // --- Week / check-in flow ---
    weekLockedHint: { en: 'This week is locked. Switch to your active week to log entries.', ar: 'هذا الأسبوع مقفل. انتقل للأسبوع النشط لإدخال البيانات.' },
    weekCompletedLocked: { en: 'Week completed and locked.', ar: 'الأسبوع مكتمل ومقفل.' },
    weekSubmittedPending: { en: 'Submitted — pending coach review.', ar: 'تم الإرسال — بانتظار مراجعة المدرب.' },
    submittedAwaitingReview: { en: 'Submitted, awaiting review', ar: 'تم الإرسال، بانتظار المراجعة' },
    weeklyCheckIn: { en: 'Weekly check-in', ar: 'التسجيل الأسبوعي' },
    weeklyCheckInEyebrow: { en: 'WEEKLY CHECK-IN', ar: 'التسجيل الأسبوعي' },
    submitThisWeekCta: { en: 'Submit this week', ar: 'إرسال هذا الأسبوع' },
    viewCheckInCta: { en: 'View check-in', ar: 'عرض التسجيل' },
    intakeWeek: { en: 'Intake', ar: 'التسجيل الأولي' },
    pendingSubmission: { en: 'Pending submission', ar: 'بانتظار الإرسال' },
    awaitingReviewStatus: { en: 'Awaiting review', ar: 'بانتظار المراجعة' },
    reviewedStatus: { en: 'Reviewed', ar: 'تمت المراجعة' },
    checkInPendingStatus: { en: 'Pending', ar: 'معلّق' },
    checkInsSubmitted: { en: 'check-ins submitted', ar: 'تسجيلات مرسلة' },
    submittedLabel: { en: 'Submitted', ar: 'تم الإرسال' },
    notUploadedLabel: { en: 'Not uploaded', ar: 'لم يُرفع' },
    weekOfLabel: { en: 'Week of', ar: 'أسبوع' },
    coachReviewedYourWeek: { en: 'Your coach reviewed this week', ar: 'مدربك راجع هذا الأسبوع' },
    weekReviewedByCoachMsg: { en: 'This week was reviewed by your coach.', ar: 'تمت مراجعة هذا الأسبوع من قبل مدربك.' },
    reviewedByCoachZack: { en: 'Reviewed by Coach Zack', ar: 'تمت المراجعة بواسطة المدرب زاك' },
    noFeedbackYet: { en: 'No feedback yet.', ar: 'لا توجد ملاحظات بعد.' },
    dueLabel: { en: 'Due', ar: 'مطلوب' },
    phoneLabel: { en: 'Phone number', ar: 'رقم الهاتف' },
    phoneHelper: {
        en: 'Used by your coach to reach you on WhatsApp / SMS. Pick your country code.',
        ar: 'يستخدمه الكوتش للتواصل معك عبر واتساب أو الرسائل. اختر رمز دولتك.'
    },
    submissionWindowTitle: { en: 'Weekly review window', ar: 'نافذة المراجعة الأسبوعية' },
    submissionWindowBody: {
        en: 'Submit your check-in on Friday — Coach Zaki sends feedback on Saturday. Submissions outside this window will not be reviewed.',
        ar: 'أرسل تسجيلك يوم الجمعة — يرسل الكوتش زكي ملاحظاته يوم السبت. التسجيلات خارج هذه النافذة لن تتم مراجعتها.'
    },
    latestCheckIn: { en: 'Latest check-in', ar: 'آخر تسجيل' },
    checkInTimeline: { en: 'Check-in timeline', ar: 'سجل التسجيلات' },
    weekA: { en: 'Week A', ar: 'الأسبوع أ' },
    weekB: { en: 'Week B', ar: 'الأسبوع ب' },
    compareCheckIns: { en: 'Compare check-ins', ar: 'مقارنة التسجيلات' },
    compareSubtitle: { en: 'Pick two weeks to compare side by side.', ar: 'اختر أسبوعين للمقارنة جنباً إلى جنب.' },
    compareNeedsTwo: { en: 'Pick two weeks to compare.', ar: 'اختر أسبوعين للمقارنة.' },
    pickDifferentWeeks: { en: 'Pick two different weeks.', ar: 'اختر أسبوعين مختلفين.' },
    totalChange: { en: 'Total change', ar: 'إجمالي التغير' },
    downSinceStart: { en: 'down since start', ar: 'منذ البداية' },
    weightOverTime: { en: 'Weight over time', ar: 'الوزن عبر الزمن' },
    weightProgress: { en: 'Weight progress', ar: 'تقدم الوزن' },
    lastWeightLabel: { en: 'Last weight', ar: 'آخر وزن' },
    bestPrefix: { en: 'Best:', ar: 'الأفضل:' },

    // --- Coach review extras ---
    cascadeNote: { en: 'Targets cascade to all upcoming weeks until you change them.', ar: 'الأهداف تنطبق على جميع الأسابيع القادمة حتى تغيّرها.' },
    generateWeeksNote: { en: 'Generates Week 1 → Week 12 on submit.', ar: 'يولّد الأسبوع 1 إلى 12 عند الإرسال.' },
    intakeDataLabel: { en: 'Intake data', ar: 'بيانات التسجيل الأولي' },
    changeQuestion: { en: 'Adjust targets for upcoming weeks?', ar: 'تعديل الأهداف للأسابيع القادمة؟' },
    deleteAuditNote: { en: 'Deletion is logged and audited.', ar: 'يتم تسجيل عمليات الحذف ومراجعتها.' },
    deleteBansFromPlatform: { en: 'Bans the user from the platform.', ar: 'يحظر المستخدم من المنصة.' },
    deleteClientTitle: { en: 'Delete client', ar: 'حذف العميل' },
    deletePermanent: { en: 'This is permanent.', ar: 'هذا الإجراء نهائي.' },
    deleteRemovesData: { en: 'Removes all of their data.', ar: 'يحذف جميع بياناتهم.' },
    deleteRevokesAccess: { en: 'Revokes all access (videos, messaging, app).', ar: 'يلغي جميع صلاحيات الوصول (فيديوهات، رسائل، تطبيق).' },
    removeMember: { en: 'Remove member', ar: 'إزالة العضو' },
    removeMemberTitle: { en: 'Remove this member?', ar: 'إزالة هذا العضو؟' },

    // --- Client info panel / profile details ---
    clientInfo: { en: 'Client info', ar: 'معلومات العميل' },
    clientInfoCtaTitle: { en: 'Client info', ar: 'معلومات العميل' },
    clientInfoCtaDesc: { en: 'Personal details, measurements, and plan.', ar: 'البيانات الشخصية والقياسات وخطة التدريب.' },
    info: { en: 'Info', ar: 'معلومات' },
    personalInfo: { en: 'Personal info', ar: 'البيانات الشخصية' },
    personalDetails: { en: 'Personal details', ar: 'البيانات الشخصية' },
    measurements: { en: 'Measurements', ar: 'القياسات' },
    age: { en: 'Age', ar: 'العمر' },
    birthdate: { en: 'Birthdate', ar: 'تاريخ الميلاد' },
    gender: { en: 'Gender', ar: 'الجنس' },
    fitnessLevel: { en: 'Fitness level', ar: 'مستوى اللياقة' },
    fitnessLevelDesc_beginner: { en: 'New to structured training.', ar: 'جديد على التدريب المنظم.' },
    fitnessLevelDesc_intermediate: { en: '6+ months consistent training.', ar: 'تدريب منتظم لأكثر من 6 أشهر.' },
    fitnessLevelDesc_pro: { en: 'Advanced lifter / competitor.', ar: 'لاعب متقدم / مُنافس.' },
    planTier: { en: 'Plan', ar: 'الخطة' },
    membership: { en: 'Membership', ar: 'العضوية' },
    coachingTag: { en: 'Coaching', ar: 'تدريب' },
    premiumClient: { en: 'Premium client', ar: 'عميل بريميوم' },
    // Note: the key name is historical — we no longer say "(free)" anywhere.
    // Founder direction: drop the "free" framing; the plan is "Community
    // member" period. The Upgrade offer below already does the work of
    // showing what's missing without needing to remind anyone they're not
    // paying.
    communityMemberFree: { en: 'Community member', ar: 'عضو مجتمع' },
    yourCoach: { en: 'Your coach', ar: 'مدربك' },
    messageClient: { en: 'Message client', ar: 'راسل الكلاينت' },
    quickMessagePlaceholder: { en: 'Send a quick note to the client…', ar: 'أرسل ملاحظة سريعة للكلاينت…' },
    messageSent: { en: 'Message sent', ar: 'تم الإرسال' },
    openThread: { en: 'Thread', ar: 'المحادثة' },
    openFullThread: { en: 'Open full thread', ar: 'فتح المحادثة كاملة' },
    send: { en: 'Send', ar: 'إرسال' },
    photosMissingWarn: { en: 'No photos uploaded for', ar: 'لم يتم رفع صور لـ' },
    photosMissingPrompt: { en: 'Submit anyway?', ar: 'الإرسال على أي حال؟' },
    youLabel: { en: 'You', ar: 'أنت' },
    clientLabelText: { en: 'Client', ar: 'عميل' },
    manageClient: { en: 'Manage client', ar: 'إدارة العميل' },
    readOnlyView: { en: 'Read-only view', ar: 'عرض للقراءة فقط' },

    // --- Coach client tabs ---
    communityTab: { en: 'Community', ar: 'المجتمع' },
    coachingClientsTab: { en: 'Coaching clients', ar: 'عملاء التدريب' },
    noClientsFound: { en: 'No clients found.', ar: 'لا يوجد عملاء.' },
    noClientsYet: { en: 'No clients yet.', ar: 'لا يوجد عملاء بعد.' },
    noCommunityMembers: { en: 'No community members yet.', ar: 'لا يوجد أعضاء مجتمع بعد.' },

    // --- Levels / categories ---
    beginner: { en: 'Beginner', ar: 'مبتدئ' },
    intermediate: { en: 'Intermediate', ar: 'متوسط' },
    proCompetitions: { en: 'Pro / Competitions', ar: 'محترف / منافسات' },
    allLevels: { en: 'All levels', ar: 'كل المستويات' },
    level: { en: 'Level', ar: 'المستوى' },
    levelLabel: { en: 'Level', ar: 'المستوى' },
    accessLevel: { en: 'Access level', ar: 'مستوى الوصول' },
    accessRole: { en: 'Access role', ar: 'صلاحية الوصول' },
    accessTier: { en: 'Access tier', ar: 'مستوى الوصول' },
    coachingAccessLabel: { en: 'Coaching clients only', ar: 'عملاء التدريب فقط' },
    coachingAccessDesc: { en: 'Locked to paid coaching members.', ar: 'مقفل لأعضاء التدريب المدفوع فقط.' },
    communityAccessLabel: { en: 'Community access', ar: 'وصول المجتمع' },
    communityAccessDesc: { en: 'Open to all signed-in members.', ar: 'متاح لجميع الأعضاء المسجلين.' },

    // --- Dashboard cards ---
    biozackTeamCoaching: { en: 'BioZackTeam Coaching', ar: 'تدريب بيوزاك تيم' },
    thisWeekTitle: { en: 'This week', ar: 'هذا الأسبوع' },
    streakAndScore: { en: 'Streak & score', ar: 'السلسلة والنقاط' },
    weekStreak: { en: 'week streak', ar: 'أسبوع متواصل' },
    weekCheckInStreak: { en: 'check-in streak', ar: 'سلسلة تسجيلات' },
    dailyStreakLabel: { en: 'Daily streak', ar: 'السلسلة اليومية' },
    xpToNext: { en: 'XP to next level', ar: 'نقاط للمستوى التالي' },
    profileProgress: { en: 'Profile progress', ar: 'تقدم الملف' },
    programProgress: { en: 'Program progress', ar: 'تقدم البرنامج' },
    notOnBoardYet: { en: 'Not on the leaderboard yet.', ar: 'لست في لوحة المتصدرين بعد.' },
    noScoresYet: { en: 'No scores yet.', ar: 'لا نقاط بعد.' },
    noDataYet: { en: 'No data yet.', ar: 'لا بيانات بعد.' },
    noWorkoutsAssigned: { en: 'No workouts assigned yet.', ar: 'لم يتم تعيين تمارين بعد.' },
    assignWorkouts: { en: 'Assign workouts', ar: 'تعيين تمارين' },

    // --- Leaderboard ---
    leaderboardEyebrow: { en: 'LEADERBOARD', ar: 'لوحة المتصدرين' },
    leaderboardTitle: { en: 'Top members', ar: 'أفضل الأعضاء' },
    leaderboardSubtitle: { en: 'Activity, streaks, and check-ins.', ar: 'النشاط والسلاسل والتسجيلات.' },
    top100Label: { en: 'Top 100', ar: 'أفضل 100' },
    climbingTheRanks: { en: 'Climbing the ranks', ar: 'في الصعود' },

    // --- Self-log / activity ---
    logToday: { en: 'Log today', ar: 'تسجيل اليوم' },
    logTodayToStart: { en: 'Log today to start your streak.', ar: 'سجّل اليوم لبدء سلسلتك.' },
    logsCount: { en: 'logs', ar: 'سجلات' },
    newLog: { en: 'New log', ar: 'سجل جديد' },
    recentLogs: { en: 'Recent logs', ar: 'السجلات الأخيرة' },
    noLogsYet: { en: 'No logs yet.', ar: 'لا سجلات بعد.' },
    noLogsViewing: { en: 'No logs to view yet.', ar: 'لا سجلات للعرض بعد.' },
    logRequiresField: { en: 'Please fill in at least one field.', ar: 'املأ حقلاً واحداً على الأقل.' },
    energyScale: { en: 'Energy', ar: 'الطاقة' },
    fullEnergy: { en: 'Full energy', ar: 'طاقة كاملة' },
    noEnergy: { en: 'No energy', ar: 'لا طاقة' },
    strengthScale: { en: 'Strength', ar: 'القوة' },
    strong: { en: 'Strong', ar: 'قوي' },
    weak: { en: 'Weak', ar: 'ضعيف' },
    high: { en: 'High', ar: 'مرتفع' },
    low: { en: 'Low', ar: 'منخفض' },
    starving: { en: 'Starving', ar: 'جائع جداً' },
    noHunger: { en: 'No hunger', ar: 'لا جوع' },

    // --- Programs / workouts extras ---
    courseType: { en: 'Course type', ar: 'نوع البرنامج' },
    durationMinutes: { en: 'Duration (minutes)', ar: 'المدة (بالدقائق)' },
    coverImageUrl: { en: 'Cover image URL', ar: 'رابط صورة الغلاف' },
    order: { en: 'Order', ar: 'الترتيب' },
    title: { en: 'Title', ar: 'العنوان' },
    date: { en: 'Date', ar: 'التاريخ' },
    lastUpdated: { en: 'Last updated', ar: 'آخر تحديث' },
    programCategory: { en: 'Program category', ar: 'فئة البرنامج' },
    programLengthWeeks: { en: 'Program length (weeks)', ar: 'مدة البرنامج (أسابيع)' },
    readCta: { en: 'Read', ar: 'قراءة' },

    // --- Features ---
    featureCoaching: { en: '1-on-1 coaching', ar: 'تدريب فردي' },
    featureCoachingDesc: { en: 'Weekly check-ins and personalised macros.', ar: 'تسجيلات أسبوعية وسعرات مخصّصة.' },
    featureCommunity: { en: 'Community', ar: 'المجتمع' },
    featureCommunityDesc: { en: 'Discord, members, and Q&A.', ar: 'ديسكورد وأعضاء وأسئلة.' },
    featurePrograms: { en: 'Training programs', ar: 'برامج التمارين' },
    featureProgramsDesc: { en: '100+ pre-built programs ready to run.', ar: 'أكثر من 100 برنامج جاهز.' },

    // --- Account / settings ---
    accountSection: { en: 'Account', ar: 'الحساب' },
    notifications: { en: 'Notifications', ar: 'الإشعارات' },
    settingsTitle: { en: 'Profile & Settings', ar: 'الملف والإعدادات' },
    settingsSubtitle: { en: 'Personal info, preferences, and account.', ar: 'المعلومات الشخصية والتفضيلات والحساب.' },
    myReports: { en: 'My reports', ar: 'تقاريري' },

    // --- Messaging ---
    selectConversation: { en: 'Select a conversation', ar: 'اختر محادثة' },
    startConversationMsg: { en: 'Start a conversation to send a message.', ar: 'ابدأ محادثة لإرسال رسالة.' },
    typeMessage: { en: 'Type a message...', ar: 'اكتب رسالة...' },
    noMessagesYet: { en: 'No messages yet.', ar: 'لا رسائل بعد.' },

    // --- Dashboard cards (BioZackTeam editorial) ---
    todaysTraining: { en: "Today's training", ar: 'تدريب اليوم' },
    dayLabel: { en: 'Day', ar: 'اليوم' },
    cycleLabel: { en: 'Cycle', ar: 'الدورة' },
    restDayLabel: { en: 'Rest day', ar: 'يوم راحة' },
    recoveryTagline: { en: 'Let your body recover today.', ar: 'دع جسمك يرتاح اليوم.' },
    noProgramYet: { en: 'No active program', ar: 'لا يوجد برنامج نشط' },
    chooseProgramSub: { en: 'Pick a program to start training.', ar: 'اختر برنامجاً لتبدأ التدريب.' },
    browseProgramsCta: { en: 'Choose a program', ar: 'اختر برنامجاً' },
    startWorkoutCta: { en: 'Start workout', ar: 'ابدأ التمرين' },
    continueCta: { en: 'Continue', ar: 'متابعة' },
    seeAllCta: { en: 'See all', ar: 'عرض الكل' },
    seeBoardCta: { en: 'See leaderboard', ar: 'عرض المتصدرين' },
    viewProgressCta: { en: 'View progress', ar: 'عرض التقدم' },

    // Academy card (dashboard surface)
    academyEyebrow: { en: 'ACADEMY', ar: 'الأكاديمية' },
    academyEmptyTitle: { en: 'Start the Academy', ar: 'ابدأ الأكاديمية' },
    academyEmptySub: { en: 'Foundations, then training, then nutrition.', ar: 'الأساسيات، ثم التدريب، ثم التغذية.' },
    browseAcademyCta: { en: 'Browse Academy', ar: 'تصفح الأكاديمية' },
    startLearning: { en: 'Start learning', ar: 'ابدأ التعلم' },
    continueLearning: { en: 'Continue learning', ar: 'تابع التعلم' },
    startCourseCta: { en: 'Start course', ar: 'ابدأ الدورة' },
    lessonsUnit: { en: 'lessons', ar: 'دروس' },
    completeLabel: { en: 'complete', ar: 'مكتمل' },

    // Standing / leaderboard / activity strip
    yourStanding: { en: 'Your standing', ar: 'مركزك' },
    allTimeLabel: { en: 'All-time', ar: 'كل الأوقات' },
    ofLabel: { en: 'of', ar: 'من' },
    progressEyebrow: { en: 'PROGRESS', ar: 'التقدم' },
    progressDesc: { en: 'Track your weekly check-ins and weight.', ar: 'تابع تسجيلاتك الأسبوعية ووزنك.' },
    chartsMeasurementsPhotos: { en: 'Charts, measurements, photos', ar: 'الرسوم والقياسات والصور' },
    coachLabel: { en: 'Coach', ar: 'المدرب' },
    athleteFallback: { en: 'Athlete', ar: 'رياضي' },
    currentStreakLabel: { en: 'Current streak', ar: 'السلسلة الحالية' },
    toGoalLabel: { en: 'to goal', ar: 'حتى الهدف' },

    // Community surface
    communityEyebrow: { en: 'COMMUNITY', ar: 'المجتمع' },
    biozackTeamSelfTracked: { en: 'BioZackTeam · Self-tracked', ar: 'بيوزاك تيم · تتبع ذاتي' },
    whatsHappening: { en: "What's happening", ar: 'آخر الأخبار' },

    // Self-log empty states
    logFirstWeight: { en: 'Log your first weight to see progress.', ar: 'سجّل وزنك الأول لرؤية التقدم.' },
    logActivityToStart: { en: 'Log a session to start your streak.', ar: 'سجّل جلسة لبدء سلسلتك.' },
    logsLabel: { en: 'logs', ar: 'سجلات' },

    // Time-of-day greetings — used in dashboard welcome headers
    goodMorning: { en: 'Good morning', ar: 'صباح الخير' },
    goodAfternoon: { en: 'Good afternoon', ar: 'مساء الخير' },
    goodEvening: { en: 'Good evening', ar: 'مساء النور' },
    todayLabel: { en: 'Today', ar: 'اليوم' },

    // ── Diets / nutrition ─────────────────────────────────────────
    navDiets: { en: 'Diets', ar: 'الحميات' },
    dietsTitle: { en: 'Diets', ar: 'الحميات' },
    dietsEyebrow: { en: 'Nutrition', ar: 'التغذية' },
    dietsSubtitle: { en: 'Calculate your daily targets, then get matched to a plan that fits your goal and meal cadence.', ar: 'احسب أهدافك اليومية، ثم احصل على خطة تناسب هدفك وعدد وجباتك.' },

    // Calculator hero card
    dietCalculatorEyebrow: { en: 'CALCULATOR', ar: 'الحاسبة' },
    dietProfileSaved: { en: 'YOUR PLAN', ar: 'خطتك' },
    dietCalculatePrompt: { en: 'Calculate my plan', ar: 'احسب خطتي' },
    dietRecalculatePrompt: { en: 'Update your targets', ar: 'حدّث أهدافك' },
    dietCalculateBlurb: { en: 'Sex, age, weight, height, activity, goal. We do the math, match the plan.', ar: 'الجنس، العمر، الوزن، الطول، النشاط، الهدف. نحسب الأرقام ونطابق الخطة.' },
    startCalculator: { en: 'Start', ar: 'ابدأ' },
    recalculate: { en: 'Recalculate', ar: 'إعادة الحساب' },

    // Wizard steps
    dietWizardStep1: { en: 'Your numbers', ar: 'بياناتك' },
    dietWizardStep2: { en: 'Your targets', ar: 'أهدافك' },
    dietWizardStep3: { en: 'Choose meal count', ar: 'اختر عدد الوجبات' },
    dietWizardStep4: { en: 'Your matched plan', ar: 'خطتك المطابقة' },
    dietWizardStep2Note: { en: 'These are your daily targets. Next: choose how many meals per day fits your schedule.', ar: 'هذه أهدافك اليومية. التالي: اختر عدد الوجبات التي تناسب جدولك.' },
    dietWizardStep3Body: { en: 'Pick the meal cadence that fits your day. Both plans hit the same calorie + macro targets.', ar: 'اختر إيقاع الوجبات الذي يناسب يومك. كلتا الخطتين تحقق نفس أهداف السعرات والماكروز.' },

    // Wizard fields
    sex: { en: 'Sex', ar: 'الجنس' },

    // Targets / macros
    targetCalories: { en: 'Target', ar: 'الهدف' },
    macroSplit: { en: 'Macro split', ar: 'توزيع الماكروز' },
    mealsPerDay: { en: 'meals/day', ar: 'وجبات/يوم' },
    threeMealsBlurb: { en: 'Bigger meals, simpler routine.', ar: 'وجبات أكبر، روتين أبسط.' },
    fourMealsBlurb: { en: 'Smaller meals, steady energy.', ar: 'وجبات أصغر، طاقة ثابتة.' },
    trainingDay: { en: 'Training day', ar: 'يوم التمرين' },
    restDay: { en: 'Rest day', ar: 'يوم الراحة' },
    filterByCalories: { en: 'Calories', ar: 'السعرات' },
    todaysNutrition: { en: 'Today’s nutrition', ar: 'تغذية اليوم' },
    viewMyPlan: { en: 'View my plan', ar: 'عرض خطتي' },

    // Diet — assigned plan deep-link + dashboard CTAs
    startMyPlan: { en: 'Start my plan', ar: 'ابدأ خطتي' },
    openMyDiet: { en: 'Open my diet', ar: 'افتح خطتي' },
    myPlanLabel: { en: 'My plan', ar: 'خطتي' },
    activePlanEyebrow: { en: 'Your active plan', ar: 'خطتك النشطة' },
    openMyPlan: { en: 'Open my plan', ar: 'افتح خطتي' },
    switchPlanHint: {
        en: 'Want a different tier? Pick another plan below — switching replaces your current plan.',
        ar: 'تريد عددًا مختلفًا من السعرات؟ اختر خطة أخرى أدناه — التبديل يستبدل خطتك الحالية.',
    },

    // Diet — replace-confirm banners
    replaceCurrentPlanLead: {
        en: 'Picking this plan will replace your current one:',
        ar: 'اختيار هذه الخطة سيستبدل خطتك الحالية:',
    },
    replaceWithThisPlan: { en: 'Replace with this plan', ar: 'استبدل بهذه الخطة' },

    // Progress card — caveman-clear "what's inside"
    progressInsideWeight: {
        en: 'Weight — your weekly weight, line chart.',
        ar: 'الوزن — وزنك الأسبوعي، رسم بياني.',
    },
    progressInsideMeasurements: {
        en: 'Measurements — waist, chest, arms, thighs over time.',
        ar: 'القياسات — الخصر، الصدر، الذراعين، الفخذين عبر الزمن.',
    },
    progressInsidePhotos: {
        en: 'Photos — front, side, back week-by-week.',
        ar: 'الصور — أمامية، جانبية، خلفية أسبوعًا بأسبوع.',
    },
    progressInsideStreak: {
        en: 'Streak & level — your activity score, days in a row, level.',
        ar: 'السلسلة والمستوى — درجة نشاطك، أيامك المتتالية، مستواك.',
    },
    progressInsideMetrics: {
        en: 'Energy, Strength, Hunger — weekly sliders + cardio calories.',
        ar: 'الطاقة والقوة والجوع — مؤشرات أسبوعية + سعرات الكارديو.',
    },
    progressEmptyHint: {
        en: 'Log your first weight to see your trend take shape.',
        ar: 'سجّل وزنك الأول لتشاهد منحناك يتشكّل.',
    },
    openMyProgress: { en: 'Open my progress', ar: 'افتح تقدّمي' },

    // Match / assign
    assignDietCta: { en: 'Assign this plan', ar: 'تعيين هذه الخطة' },
    dietNoMatchTitle: { en: 'Plans being prepared', ar: 'الخطط قيد الإعداد' },
    dietNoMatchBody: { en: 'Your coach is uploading the matching diet PDFs. Your targets are saved and the matcher will assign automatically when plans land.', ar: 'مدربك يرفع ملفات الحمية المطابقة. أهدافك محفوظة وسيتم تعيين الخطة تلقائياً عند توفرها.' },
    dietCatalogEmpty: { en: 'Plans coming soon', ar: 'الخطط قريباً' },
    dietCatalogEmptyBody: { en: 'Coach is preparing the diet PDFs. Run the calculator above to save your targets — plans will be matched automatically.', ar: 'المدرب يحضّر ملفات الحمية. شغّل الحاسبة أعلاه لحفظ أهدافك، وسيتم المطابقة تلقائياً.' },
    dietNoFilterMatch: { en: 'No plans match these filters', ar: 'لا توجد خطط تطابق هذه المعايير' },
    dietNoFilterMatchBody: { en: 'Try a different goal or meal count.', ar: 'جرّب هدفاً أو عدد وجبات مختلف.' },
    filterByGoal: { en: 'Goal', ar: 'الهدف' },

    // Generic
    next: { en: 'Next', ar: 'التالي' },

    // Page eyebrows / section labels
    coachConsoleEyebrow: { en: 'Coach Console', ar: 'لوحة المدرب' },
    memberIdentityEyebrow: { en: 'Member Identity', ar: 'الهوية' },
    membersLoungeEyebrow: { en: 'Members Lounge', ar: 'صالة الأعضاء' },
    managementEyebrow: { en: 'Management', ar: 'الإدارة' },

    // ─── Launch-readiness i18n: keys added so the Arabic build doesn't
    //     leak English literals on these pages. EN preserves the existing
    //     copy verbatim.
    // VideoLibrary
    zeroToHeroEyebrow: { en: 'Zero to Hero', ar: 'من الصفر إلى البطل' },
    academyTitle: { en: 'BioZackTeam University', ar: 'أكاديمية بيوزاك تيم' },
    academyHeaderBlurb: {
        en: 'A structured path from fundamentals to elite mastery. Required courses build the foundation your coaching calls are built on.',
        ar: 'مسار منظّم من الأساسيات إلى الإتقان. الدروس الإلزامية تبني الأساس الذي تنطلق منه جلسات التدريب.',
    },
    bonusContent: { en: 'Bonus Content', ar: 'محتوى إضافي' },
    noAcademyCoursesYet: { en: 'No academy courses yet.', ar: 'لا توجد دروس بعد.' },
    noAcademyCoursesCoachHint: {
        en: 'Switch to the Manage tab to create the first one.',
        ar: 'انتقل إلى تبويب الإدارة لإنشاء أول درس.',
    },

    // Community
    joinTheCommunityHeader: { en: 'Join the', ar: 'انضمّ إلى' },
    communityWord: { en: 'Community', ar: 'المجتمع' },
    communityIntroBlurb: {
        en: 'Connect with fellow members, share your progress, ask questions, and get support — all on Discord.',
        ar: 'تواصل مع الأعضاء، شارك تقدّمك، اطرح الأسئلة، واحصل على الدعم — كلّه على ديسكورد.',
    },

    // CommunityBaselineForm
    tellUsAboutYourself: { en: 'Tell us about yourself', ar: 'أخبرنا عن نفسك' },
    baselineSetItOnce: {
        en: 'Your baseline. Set it once, track progress weekly. We’ll calculate your daily calories and match a diet plan automatically.',
        ar: 'الأساس. عيّنه مرّة، وتابع تقدّمك أسبوعياً. سنحسب سعراتك اليومية ونوفّق لك خطة حمية تلقائياً.',
    },
    basedOnYourNumbers: {
        en: 'Based on your numbers. Pick how many meals fit your schedule.',
        ar: 'بناءً على أرقامك. اختر عدد الوجبات الذي يناسب يومك.',
    },

    // Misc user-facing strings (audited during launch hardening)
    somethingWentWrong: { en: 'Something went wrong', ar: 'حدث خطأ ما' },
    tryAgainCta: { en: 'Try Again', ar: 'حاول مرة أخرى' },
    activeCommunityLabel: { en: 'Active community', ar: 'مجتمع نشط' },
    coachEventsLabel: { en: 'Coach events', ar: 'فعاليات المدرب' },
    membersWord: { en: 'Members', ar: 'الأعضاء' },
    channelsWord: { en: 'Channels', ar: 'القنوات' },
    channelsBlurb: { en: 'Tips, wins, Q&A', ar: 'نصائح، إنجازات، أسئلة' },
    liveWord: { en: 'Live', ar: 'مباشر' },
    noProgramsFound: { en: 'No programs found', ar: 'لا توجد برامج' },
    noProgramsFoundHint: { en: 'Try adjusting your split or goal filters.', ar: 'جرّب تعديل التقسيم أو فلتر الهدف.' },
    noCustomWorkoutsYet: { en: 'No custom workouts yet', ar: 'لا توجد تمارين مخصّصة بعد' },
    noCustomWorkoutsCoachHint: { en: 'Create your first custom workout above.', ar: 'أنشئ أول تمرين مخصّص في الأعلى.' },
    noCustomWorkoutsClientHint: { en: 'Your coach hasn’t created any custom workouts yet.', ar: 'لم ينشئ مدربك أي تمرين مخصّص بعد.' },
    currentWeightLabel: { en: 'Current weight', ar: 'الوزن الحالي' },
    cardioCaloriesLabel: { en: 'Cardio calories', ar: 'سعرات الكارديو' },
    howDidThisWeekGo: { en: 'How did this week go?', ar: 'كيف سار أسبوعك؟' },
    notesOptional: { en: 'optional', ar: 'اختياري' },
    notesWord: { en: 'Notes', ar: 'ملاحظات' },

    // Workouts
    trainingHubEyebrow: { en: 'Training Hub', ar: 'مركز التدريب' },
    workoutsCommunitySubtitle: {
        en: 'Browse complete training programs with 10-day rotations.',
        ar: 'تصفّح برامج تدريب كاملة بدورات من 10 أيام.',
    },
    categoryNoun: { en: 'Category', ar: 'فئة' },
    trainingProgramsTab: { en: 'Training Programs', ar: 'برامج التدريب' },
    customWorkoutsTab: { en: 'Custom Workouts', ar: 'تمارين مخصّصة' },
    filterByCategory: { en: 'Filter by Category', ar: 'تصفية حسب الفئة' },

    // ─── Plan Detail page ───────────────────────────────────────────────
    backToDiets: { en: 'Back to diets', ar: 'الرجوع للحميات' },

    // How this plan works — three rules
    howThisWorks: { en: 'How this works', ar: 'كيف تعمل' },
    howThisWorksTitle: { en: 'Three rules. Read once.', ar: 'ثلاث قواعد. اقرأها مرة.' },
    howRule1Title: { en: 'Two day types: training, rest', ar: 'نوعان من الأيام: تمرين وراحة' },
    howRule1Body: {
        en: 'On gym days you eat the training-day numbers. On rest days you eat the rest-day numbers. Rest days have fewer carbs and slightly more fat to match the lower energy demand.',
        ar: 'في أيام الجيم تأكل أرقام يوم التمرين. في أيام الراحة تأكل أرقام يوم الراحة. أيام الراحة كربوهيدرات أقل ودهون أعلى قليلاً لتناسب طاقة أقل.',
    },
    howRule2Title: { en: 'Each day = your meals', ar: 'كل يوم = وجباتك' },
    howRule2Body: {
        en: 'Your daily kcal split into your chosen meal count. Each meal has a carbs / protein / fat number — that is your target. Hit those numbers and the calories take care of themselves.',
        ar: 'سعراتك اليومية مقسّمة على عدد وجباتك. كل وجبة لها رقم كربوهيدرات/بروتين/دهون — هذا هدفك. حقّق هذه الأرقام والسعرات تأخذ نصيبها من تلقاء نفسها.',
    },
    howRule3Title: { en: 'Use the food keys to weigh real food', ar: 'استخدم مفاتيح الأكل لوزن طعام حقيقي' },
    howRule3Body: {
        en: 'The food keys lower on this page tell you how many grams of protein/carbs/fat each food has per 100 g. Pick a food, do simple math, weigh, eat. The "Worked example" below shows you exactly how.',
        ar: 'مفاتيح الأكل أدناه تخبرك بكم جرام من البروتين/الكربوهيدرات/الدهون يحتويه كل طعام لكل 100 جرام. اختر طعاماً، احسب، اوزن، كل. "المثال العملي" أدناه يريك بالضبط كيف.',
    },

    // Worked example
    workedExample: { en: 'Worked example', ar: 'مثال عملي' },
    workedExampleTitleFor: { en: 'Build "{name}" with real food', ar: 'ابنِ "{name}" بطعام حقيقي' },
    workedExampleIntro: {
        en: 'This meal needs {c}g carbs · {p}g protein · {f}g fat. Here is one way to build it from the food keys below.',
        ar: 'هذه الوجبة تحتاج {c} جرام كربوهيدرات · {p} جرام بروتين · {f} جرام دهون. هذه طريقة لبنائها من مفاتيح الأكل أدناه.',
    },
    workedExampleNote: {
        en: 'These numbers are rounded to 5 g — close enough. Swap chicken for fish, rice for potatoes, almonds for avocado. Use the food keys to keep the macros the same.',
        ar: 'الأرقام مقرّبة لـ 5 جرام — قريبة بما يكفي. استبدل الدجاج بسمك، الأرز ببطاطس، اللوز بأفوكادو. استخدم مفاتيح الأكل لتحافظ على نفس الماكروز.',
    },
    uncookedSuffix: { en: 'uncooked', ar: 'غير مطبوخ' },

    // Daily plan
    dailyPlan: { en: 'Daily plan', ar: 'الخطة اليومية' },

    // Food keys
    foodKeys: { en: 'Food keys', ar: 'مفاتيح الأكل' },
    foodKeysTitle: { en: 'What to eat — and how much', ar: 'ماذا تأكل — وكم' },
    foodKeysIntro: {
        en: "Each row tells you how much protein / carbs / fat is in 100 grams of that food (or 20 g for fats — they're calorie-dense). Build your meals from these.",
        ar: 'كل صف يخبرك بكم بروتين/كربوهيدرات/دهون في 100 جرام من ذلك الطعام (أو 20 جرام للدهون — كثيفة السعرات). ابنِ وجباتك من هذه.',
    },
    proteinSources: { en: 'Proteins (per 100 g)', ar: 'البروتين (لكل 100 جرام)' },
    carbSources:    { en: 'Carbs (per 100 g)',    ar: 'الكربوهيدرات (لكل 100 جرام)' },
    fatSources:     { en: 'Fats (per 20 g)',      ar: 'الدهون (لكل 20 جرام)' },
    foodHeaderFood: { en: 'Food', ar: 'الطعام' },
    foodHeaderFibre: { en: 'Fibre', ar: 'ألياف' },
    veggies:        { en: 'Veggies', ar: 'خضروات' },
    fruits:         { en: 'Fruits',  ar: 'فواكه' },

    // Supplements
    supplementsEyebrow: { en: 'Supplements', ar: 'المكمّلات' },
    supplementsTitle:   { en: 'What to take, when', ar: 'ماذا تأخذ ومتى' },
    preBreakfast:       { en: 'Pre-breakfast', ar: 'قبل الفطور' },
    intraWorkout:       { en: 'Intra-workout', ar: 'أثناء التمرين' },
    postWorkout:        { en: 'Post-workout',  ar: 'بعد التمرين' },

    // Carb adjustment + signals
    weeklyCheckin:      { en: 'Weekly check-in', ar: 'التسجيل الأسبوعي' },
    adjustCarbsTitle:   { en: 'Read your body — adjust slowly', ar: 'اقرأ جسمك — عدّل ببطء' },
    carbAdjustmentNote: {
        en: 'Carbs should be decreased or increased every week based on hunger level and sensitivity. Adjust in small steps (10–20 g per day at a time), give the change a full week before judging it, and keep protein anchored at 185 g.',
        ar: 'يجب رفع أو خفض الكربوهيدرات كل أسبوع حسب الجوع والحساسية. عدّل بخطوات صغيرة (10–20 جرام في اليوم)، أعطِ التغيير أسبوعاً كاملاً قبل الحكم، واحفظ البروتين على 185 جرام.',
    },

    // Disclaimer + quote
    dietDisclaimer: {
        en: 'Educational use only. Not medical advice. If you have a medical condition, are pregnant, or take medication, review changes with a registered dietitian or your physician before adopting them.',
        ar: 'للاستخدام التعليمي فقط. ليست نصيحة طبية. إن كانت لديك حالة طبية، حامل، أو تتناول دواء، راجع التغييرات مع أخصائي تغذية مسجّل أو طبيبك قبل اعتمادها.',
    },
    dietQuote: {
        en: 'He who lives without discipline lives with no honor.',
        ar: 'من يعيش بلا انضباط يعيش بلا شرف.',
    },

    // Plan-detail action labels
    assigning:   { en: 'Assigning…', ar: 'جاري التعيين…' },
    assigned:    { en: 'Assigned ✓', ar: 'تم التعيين ✓' },
    downloadPdf: { en: 'Download PDF', ar: 'تحميل الملف' },
    planNotFound: { en: 'Plan not found', ar: 'الخطة غير موجودة' },
    planNotFoundBody: {
        en: 'This diet plan no longer exists or has been archived.',
        ar: 'هذه الخطة لم تعد موجودة أو تم أرشفتها.',
    },

    // Day toggle (alongside existing trainingDay/restDay)
    trainingShort: { en: 'Training', ar: 'تمرين' },
    restShort:     { en: 'Rest',     ar: 'راحة' },

    // ─── Settings page additions ────────────────────────────────────────
    theme:             { en: 'Theme',             ar: 'السمة' },
    lightTheme:        { en: 'Light',             ar: 'فاتحة' },
    darkTheme:         { en: 'Dark',              ar: 'داكنة' },
    editProfileInfo:   { en: 'Edit profile info', ar: 'تعديل معلومات الملف' },
    targetWeight:      { en: 'Target weight',     ar: 'الوزن المستهدف' },

    // ─── Calorie calculator (DietWizard) — sex / goal / activity ────────
    // Sex chips
    male:   { en: 'Male',   ar: 'ذكر' },
    female: { en: 'Female', ar: 'أنثى' },

    // Diet goals (the calculator's 6-tier taxonomy from dietCalculator.ts).
    // Distinct from the user-onboarding "goalFatLoss"/etc. keys above —
    // these correspond 1:1 to the DietGoal type so the chip labels and
    // calorie-adjustment numbers stay consistent across surfaces.
    dietGoalAggressiveCut: { en: 'Aggressive cut', ar: 'تنشيف قوي' },
    dietGoalCut:           { en: 'Cut',            ar: 'تنشيف' },
    dietGoalRecomp:        { en: 'Recomp',         ar: 'إعادة تكوين' },
    dietGoalMaintain:      { en: 'Maintain',       ar: 'الحفاظ' },
    dietGoalLeanBulk:      { en: 'Lean bulk',      ar: 'تضخيم نظيف' },
    dietGoalBulk:          { en: 'Bulk',           ar: 'تضخيم' },

    // Activity level names + one-line descriptions used in the activity
    // picker. Keys are lowercase to match the enum values directly.
    activitySedentary:     { en: 'Sedentary', ar: 'خامل' },
    activityLight:         { en: 'Light',     ar: 'خفيف' },
    activityModerate:      { en: 'Moderate',  ar: 'متوسط' },
    activityActive:        { en: 'Active',    ar: 'نشيط' },
    activityExtra:         { en: 'Extra',     ar: 'مكثّف' },

    activitySedentaryDesc: { en: 'Desk job, no exercise',                ar: 'عمل مكتبي، بلا تمرين' },
    activityLightDesc:     { en: 'Exercise 1–3 days/week',               ar: 'تمرين 1–3 أيام/أسبوع' },
    activityModerateDesc:  { en: 'Exercise 3–5 days/week',               ar: 'تمرين 3–5 أيام/أسبوع' },
    activityActiveDesc:    { en: 'Hard exercise 6–7 days/week',          ar: 'تمرين شاق 6–7 أيام/أسبوع' },
    activityExtraDesc:     { en: 'Hard daily exercise + physical job',   ar: 'تمرين شاق يومي + عمل بدني' },

    // ─── Coach diet-assign flows + AssignDietPicker ─────────────────────
    assignDiet:            { en: 'Assign diet',           ar: 'تعيين خطة' },
    assignDietEyebrow:     { en: 'Assign diet',           ar: 'تعيين خطة' },
    assignDietPickPlan:    { en: 'Pick a plan',           ar: 'اختر خطة' },
    assignDietToClient:    { en: 'Pick a plan for',       ar: 'اختر خطة لـ' },
    alreadyAssigned:       { en: 'Already assigned',      ar: 'مُعيّنة بالفعل' },
    changeDiet:            { en: 'Change diet',           ar: 'تغيير الخطة' },
    current:               { en: 'Current',               ar: 'الحالية' },
    dietPlan:              { en: 'Diet plan',             ar: 'خطة الحمية' },
    matchedPlan:           { en: 'Matched plan',          ar: 'الخطة المطابقة' },
    noDietAssigned:        { en: 'No diet assigned yet.', ar: 'لم يتم تعيين خطة بعد.' },
    planSingular:          { en: 'plan',                  ar: 'خطة' },
    planPlural:            { en: 'plans',                 ar: 'خطط' },
    searchPlans:           { en: 'Search plans…',         ar: 'ابحث في الخطط…' },

    // Plan-name suffix used by tPlanName(). Replaces the trailing "meals"
    // word so a plan saved as "1,400 kcal · 4 meals" reads in Arabic as
    // "1,400 kcal · 4 وجبات" without forking the catalog data.
    mealsWord:             { en: 'meals', ar: 'وجبات' },

    // Tombstone label for posts/comments authored by deleted users.
    // The cloud function writes `authorId: ''` + `authorName: '[deleted]'`;
    // the UI substitutes this label so neither the sentinel nor an empty
    // string is ever rendered.
    deletedUserLabel:      { en: 'Deleted user', ar: 'مستخدم محذوف' },

    // ─── My Journey panel (coaching client profile tab) ────────────────
    myJourneyTitle:           { en: 'My journey',           ar: 'رحلتي' },
    myJourneyEyebrow:         { en: 'My journey',           ar: 'رحلتي' },
    weekLabel:                { en: 'Week',                 ar: 'الأسبوع' },
    // (ofLabel already defined above — reused.)
    checkInReviewedSingular:  { en: 'check-in reviewed',    ar: 'تسجيل تمت مراجعته' },
    checkInReviewedPlural:    { en: 'check-ins reviewed',   ar: 'تسجيلات تمت مراجعتها' },
    journeyEmptyHint: {
        en: 'Your transformation starts here. Submit your first check-in to begin.',
        ar: 'تحوّلك يبدأ من هنا. أرسل أول تسجيل لتبدأ رحلتك.',
    },
    baselineLabel:            { en: 'Baseline',             ar: 'البداية' },
    nowLabel:                 { en: 'Now',                  ar: 'الآن' },
    totalLabel:               { en: 'total',                ar: 'الإجمالي' },
    startedLabel:             { en: 'Started',              ar: 'بدأ في' },
    weeksUnit:                { en: 'weeks',                ar: 'أسابيع' },

    coachLetterEyebrow:       { en: 'Letter from your coach', ar: 'رسالة من مدرّبك' },
    coachLetterEmpty: {
        en: 'Your coach will write here after they review your first check-in.',
        ar: 'سيكتب لك مدرّبك هنا بعد مراجعة أول تسجيل لك.',
    },

    transformationReelEyebrow: { en: 'Transformation reel', ar: 'سلسلة التحوّل' },
    reviewedShort:             { en: 'reviewed',            ar: 'مراجَع' },
    submittedShort:            { en: 'submitted',           ar: 'مُرسَل' },
    pendingShort:              { en: 'pending',             ar: 'قيد الانتظار' },
    vsBaselineShort:           { en: 'vs baseline',         ar: 'مقارنة بالبداية' },
    reelEmptyTitle:            { en: 'Your transformation starts here', ar: 'تحوّلك يبدأ من هنا' },
    reelEmptyBody: {
        en: 'Submit your first weekly check-in with photos to begin your visual journey.',
        ar: 'أرسل أول تسجيل أسبوعي مع الصور لتبدأ رحلتك المرئية.',
    },

    theNumbersEyebrow:         { en: 'The numbers',         ar: 'الأرقام' },
    weeksActiveLabel:          { en: 'Weeks active',        ar: 'أسابيع النشاط' },
    totalChangeLabel:          { en: 'Total change',        ar: 'إجمالي التغيير' },
    checkInsReviewedLabel:     { en: 'Check-ins reviewed',  ar: 'تسجيلات مراجَعة' },

    // ── Pricing / Subscribe (launch-day, Stripe Payment Links) ────
    navUpgrade:                { en: 'Upgrade',                                          ar: 'الترقية' },

    // Hero
    pricingEyebrow:            { en: 'Founding Member Launch',                           ar: 'إطلاق الأعضاء المؤسسين' },
    pricingHeroLine1:          { en: 'Just 5 dirhams',                                   ar: 'فقط 5 دراهم' },
    pricingHeroLine2:          { en: 'A day.',                                           ar: 'في اليوم.' },
    pricingHeroSub:            { en: 'Everything Dr. Med has built — the full system, his community, and the protocols that built 200+ champions.', ar: 'كل ما بناه دكتور ميد — النظام الكامل، مجتمعه، والبروتوكولات التي صنعت أكثر من 200 بطل.' },
    pricingHeroFinePrint:      { en: 'Cancel anytime · 7-day refund · Stripe checkout',  ar: 'الإلغاء في أي وقت · استرداد خلال 7 أيام · الدفع عبر سترايب' },
    pricingLaunchBadge:        { en: '48-hour founding rate · locked for life',          ar: 'سعر تأسيسي لمدة 48 ساعة · مثبّت مدى الحياة' },

    // Tier · Monthly
    tierMonthlyEyebrow:        { en: 'Pay as you go',                                    ar: 'ادفع شهرياً' },
    tierMonthlyTitle:          { en: 'Monthly',                                          ar: 'شهري' },
    tierMonthlyBlurb:          { en: 'Recurring monthly. Cancel anytime.',               ar: 'اشتراك شهري متجدد. الإلغاء في أي وقت.' },
    tierMonthlyUnit:           { en: '/ month',                                          ar: '/ الشهر' },
    tierMonthlyBilling:        { en: 'USD · billed monthly',                             ar: 'بالدولار · فوترة شهرية' },
    tierMonthlyCta:            { en: 'Start monthly',                                    ar: 'ابدأ الاشتراك الشهري' },

    // Tier · Yearly Founding ($199)
    tierFoundingBadge:         { en: 'Founding rate · 48h only',                         ar: 'سعر تأسيسي · 48 ساعة فقط' },
    tierFoundingEyebrow:       { en: 'Yearly · Founding rate',                           ar: 'سنوي · سعر تأسيسي' },
    tierFoundingTitle:         { en: 'Yearly Founding',                                  ar: 'العضوية التأسيسية السنوية' },
    tierFoundingBlurb:         { en: 'Locked for life. As long as you stay subscribed, you keep $199/yr forever.', ar: 'مثبّت مدى الحياة. ما دمت مشتركاً، تبقى على 199$/سنة إلى الأبد.' },
    tierFoundingUnit:          { en: '/ year',                                           ar: '/ السنة' },
    tierFoundingDailyPrefix:   { en: '≈',                                                ar: '≈' },
    tierFoundingDailyUsd:      { en: '$0.55 / day',                                      ar: '0.55$ في اليوم' },
    tierFoundingDailyMad:      { en: '5 MAD / day',                                      ar: '5 درهم في اليوم' },
    tierFoundingDailyJoin:     { en: '· just',                                           ar: '· فقط' },
    tierFoundingSavings:       { en: 'Save $221 vs monthly · 53% off',                   ar: 'وفّر 221$ مقارنة بالشهري · خصم 53٪' },
    tierFoundingLockedBullet:  { en: 'Founding-member rate locked for life',             ar: 'سعر العضو المؤسس مثبّت مدى الحياة' },
    tierFoundingCta:           { en: 'Lock in $199 · 48h only',                          ar: 'ثبّت 199$ · 48 ساعة فقط' },

    // Tier · Coaching ($149)
    tierCoachingEyebrow:       { en: 'Personal Coaching',                                ar: 'تدريب شخصي' },
    tierCoachingTitle:         { en: 'Coaching with Med',                                ar: 'تدريب مع ميد' },
    tierCoachingBlurb:         { en: 'Direct messages, custom protocols, ongoing accountability.', ar: 'رسائل مباشرة، بروتوكولات مخصّصة، متابعة مستمرة.' },
    tierCoachingUnit:          { en: '/ month',                                          ar: '/ الشهر' },
    tierCoachingBundled:       { en: 'Platform access included · no extra fee',          ar: 'الوصول إلى المنصّة مشمول · بدون رسوم إضافية' },
    tierCoachingCta:           { en: 'Start coaching',                                   ar: 'ابدأ التدريب' },

    // Platform feature bullets (shown on Monthly + Yearly Founding cards)
    pfFeatLibrary:             { en: 'Full Zero-to-Hero Academy library',                ar: 'مكتبة أكاديمية Zero-to-Hero الكاملة' },
    pfFeatLiveCalls:           { en: 'Weekly live group calls',                          ar: 'مكالمات جماعية مباشرة أسبوعية' },
    pfFeatCommunity:           { en: 'Community + monthly Q&A',                          ar: 'المجتمع + جلسة أسئلة وأجوبة شهرية' },
    pfFeatPrograms:            { en: '100+ training programs',                           ar: 'أكثر من 100 برنامج تدريبي' },
    pfFeatDietCalc:            { en: 'Diet calculator + meal plans',                     ar: 'حاسبة الحمية + خطط الوجبات' },
    pfFeatProgress:            { en: 'Progress tracking + check-ins',                    ar: 'متابعة التقدم + التسجيلات الأسبوعية' },

    // Coaching feature bullets
    coFeatDM:                  { en: 'Direct messaging with Dr. Med',                    ar: 'مراسلة مباشرة مع دكتور ميد' },
    coFeatProtocols:           { en: 'Custom training + diet protocols',                 ar: 'بروتوكولات تدريب وحمية مخصّصة' },
    coFeatAccountability:      { en: 'Ongoing accountability',                           ar: 'متابعة ومحاسبة مستمرة' },
    coFeatPlatform:            { en: 'Platform access included — no extra fee',          ar: 'الوصول إلى المنصّة مشمول — بدون رسوم إضافية' },
    coFeatPriority:            { en: 'Priority response window',                         ar: 'أولوية في الردود' },

    // How-it-works
    pricingHowTitle:           { en: 'How it works',                                     ar: 'كيف يعمل الاشتراك' },
    pricingHowStep1:           { en: 'Click your tier above → Stripe checkout opens in a new tab.', ar: 'اضغط على باقتك بالأعلى → ستفتح صفحة الدفع الآمنة عبر سترايب في نافذة جديدة.' },
    pricingHowStep2:           { en: 'Pay with card, Apple Pay, or Google Pay — Stripe handles everything secure.', ar: 'ادفع ببطاقة، Apple Pay أو Google Pay — كل العملية آمنة عبر سترايب.' },
    pricingHowStep3LoggedIn:   { en: 'Your account is upgraded by the team within 1 hour. You\'ll get an email confirming access.', ar: 'سيقوم الفريق بترقية حسابك خلال ساعة. سيصلك بريد إلكتروني بتأكيد الوصول.' },
    pricingHowStep3Guest:      { en: 'Create your account at /login first, then come back. Your account is upgraded within 1 hour of payment.', ar: 'أنشئ حسابك من /login أولاً ثم عُد. سيتم ترقية حسابك خلال ساعة من الدفع.' },
    pricingHowStep4:           { en: 'Sign in to the platform — full access unlocked.', ar: 'سجّل الدخول إلى المنصّة — الوصول الكامل مفعّل.' },
    pricingHowSupport:         { en: '7-day no-questions refund. Email',                 ar: 'استرداد خلال 7 أيام بدون أسئلة. للدعم راسل' },
    pricingHowSupportSuffix:   { en: 'for support.',                                     ar: '.' },

    // Footer fine print
    pricingFinePrint:          { en: 'Prices in USD. Stripe Tax automatically handles VAT for international buyers. Yearly subscribers can cancel anytime — access continues until the end of the paid period. Founding-member rate persists on every renewal as long as the subscription stays active.', ar: 'الأسعار بالدولار. ضريبة سترايب تتعامل تلقائياً مع ضريبة القيمة المضافة للمشترين الدوليين. يمكن للمشتركين السنويين الإلغاء في أي وقت — يستمر الوصول حتى نهاية الفترة المدفوعة. يبقى سعر العضو المؤسس عند كل تجديد ما دام الاشتراك فعّالاً.' },

    // ─── Loader (full-screen, pre-render) ──────────────────────────
    loaderLoading:             { en: 'Loading',                              ar: 'جاري التحميل' },
    loaderPreparing:           { en: 'Preparing your training hub',          ar: 'نُجهّز مركز تدريبك' },
    loaderProgress:            { en: 'Loading your progress',                ar: 'نُحمّل تقدّمك' },
    loaderAlmost:              { en: 'Almost ready',                         ar: 'اقتربنا من الجاهزية' },
    loaderSyncing:             { en: 'Syncing your latest data',             ar: 'نُحدّث آخر بياناتك' },
    loaderTuning:              { en: 'Tuning your dashboard',                ar: 'نُهيّئ لوحتك' },

    // ─── New-version toast (login screen only) ─────────────────────
    newVersionTitle:           { en: 'App updated',                          ar: 'تم تحديث التطبيق' },
    newVersionSub:             { en: 'Reload to see the latest version.',    ar: 'أعد التحميل لمشاهدة آخر نسخة.' },
    newVersionReload:          { en: 'Reload',                               ar: 'إعادة التحميل' },
    newVersionDismiss:         { en: 'Dismiss update banner',                ar: 'إخفاء إشعار التحديث' },

    // ─── Dashboard chapters (Step 1 / 2 / 3 redesign) ──────────────
    dashChapter:               { en: 'Chapter',                              ar: 'الفصل' },
    dashChapterToday:          { en: 'Today',                                ar: 'اليوم' },
    dashChapterTodaySub:       { en: 'Do these three things now — submit your check-in, train, eat.',
                                 ar: 'افعل هذه الأمور الثلاثة الآن — سجّل متابعتك، تدرّب، وتناول وجباتك.' },
    dashChapterTodayCommunitySub: { en: 'What to do right now — train, eat, repeat.',
                                    ar: 'ما الذي تفعله الآن — تدرّب، تناول، وكرّر.' },
    dashChapterProgress:       { en: 'Your progress',                        ar: 'تقدّمك' },
    dashChapterProgressSub:    { en: 'Streak, weight trend, and where you rank — your numbers at a glance.',
                                 ar: 'سلسلة المواظبة، تطوّر الوزن، وترتيبك — أرقامك في لمحة.' },
    dashChapterGrow:           { en: 'Grow & connect',                       ar: 'تعلّم وتواصل' },
    dashChapterGrowSub:        { en: 'Keep learning and see what the rest of the team is doing this week.',
                                 ar: 'واصِل التعلّم وشاهد ما يفعله بقية الفريق هذا الأسبوع.' },

    // ─── PurposeLine captions on dashboard cards ───────────────────
    purposeAcademyEmpty:       { en: 'Bite-sized lessons from coach Zaki — structured by level.',
                                 ar: 'دروس قصيرة من كوتش زاكي — مرتّبة حسب المستوى.' },
    purposeAcademyContinueNew: { en: 'Start the next required course in your path.',
                                 ar: 'ابدأ الدورة التالية المطلوبة في مسارك.' },
    purposeAcademyContinue:    { en: 'Pick up where you left off in the curriculum.',
                                 ar: 'تابع من حيث توقفت في المنهج.' },
    purposeWorkoutEmpty:       { en: 'Browse 10-day rotations and pick the one matching your goal.',
                                 ar: 'تصفّح برامج العشرة أيام واختر ما يناسب هدفك.' },
    purposeWorkoutRest:        { en: 'Rest day — open it to see recovery notes and what comes next.',
                                 ar: 'يوم راحة — افتحه لرؤية ملاحظات التعافي وما يليه.' },
    purposeWorkoutActive:      { en: 'Open today\'s session to follow exercises, sets, and rest.',
                                 ar: 'افتح حصة اليوم لمتابعة التمارين والمجموعات وفترات الراحة.' },
    purposeDietEmpty:          { en: 'Quick calculator that picks the right calorie tier and macro split for you.',
                                 ar: 'حاسبة سريعة تختار لك سعراتك المناسبة وتقسيم الماكروز.' },
    purposeDietActive:         { en: 'Open your meal plan to see today\'s macros, food keys, and the day-by-day split.',
                                 ar: 'افتح خطّتك الغذائية لرؤية ماكروز اليوم، ومفاتيح الأطعمة، والتقسيم اليومي.' },
    purposeCommunity:          { en: 'What the rest of the team posted this week.',
                                 ar: 'ما الذي نشره بقية الفريق هذا الأسبوع.' },
    purposeProgress:           { en: 'Your weight trend, photos, and measurements over time.',
                                 ar: 'تطوّر وزنك، وصورك، وقياساتك عبر الزمن.' },
    checkinHeroReviewed:       { en: 'Read coach Zaki\'s feedback and start the next week.',
                                 ar: 'اقرأ ملاحظات الكوتش زاكي وابدأ الأسبوع التالي.' },
    checkinHeroSubmitted:      { en: 'Already submitted — sit tight while coach Zaki reviews it.',
                                 ar: 'تم الإرسال — انتظر قليلاً بينما يراجعها الكوتش زاكي.' },
    checkinHeroPending:        { en: 'Log weight, photos, and macros so coach Zaki can review your week.',
                                 ar: 'سجّل وزنك، صورك، وماكروزك ليتمكّن الكوتش زاكي من مراجعة أسبوعك.' },

    // ─── Messages (chat) ───────────────────────────────────────────
    inbox:                     { en: 'Inbox',                                ar: 'الرسائل' },
    msgUnreadBadge:            { en: 'NEW',                                  ar: 'جديد' },
    msgPhotoFallback:          { en: 'Photo',                                ar: 'صورة' },
    msgRemoveImage:            { en: 'Remove image',                         ar: 'إزالة الصورة' },
    msgAttachImage:            { en: 'Attach image',                         ar: 'إرفاق صورة' },
    brandLogoAlt:              { en: 'BioZackTeam',                          ar: 'بيوزاك تيم' },
    msgReply:                  { en: 'Reply',                                ar: 'رد' },
    msgReact:                  { en: 'React',                                ar: 'تفاعل' },
    msgReplyingTo:             { en: 'Replying to',                          ar: 'الرد على' },
    msgCancelReply:            { en: 'Cancel reply',                         ar: 'إلغاء الرد' },
    msgEmojiPicker:            { en: 'Emojis',                               ar: 'الرموز التعبيرية' },
    msgChatAttachmentAlt:      { en: 'Chat attachment',                      ar: 'مرفق المحادثة' },
    msgUnreadAria:             { en: 'unread messages',                      ar: 'رسائل غير مقروءة' },

    // ─── Broadcast / notifications ─────────────────────────────────
    navBroadcast:              { en: 'Broadcast',                            ar: 'إرسال إشعار' },
    navNotifications:          { en: 'Notifications',                        ar: 'الإشعارات' },
    broadcastPageTitle:        { en: 'Send a broadcast',                     ar: 'إرسال إشعار جماعي' },
    broadcastPageSub:          { en: 'Push a message to every member you pick. Use it for announcements, lives, and news.',
                                 ar: 'أرسل رسالة لكل عضو تختاره. استخدمها للإعلانات، البثوث المباشرة، والأخبار.' },
    broadcastBodyLabel:        { en: 'Message',                              ar: 'الرسالة' },
    broadcastBodyPlaceholder:  { en: "Write what everyone should know — keep it short and clear. Example: \"Live Q&A tonight at 9 PM, see you there.\"",
                                 ar: 'اكتب ما يجب أن يعرفه الجميع — اجعلها قصيرة وواضحة. مثال: «بث مباشر للأسئلة الليلة الساعة 9 مساءً».' },
    broadcastAudienceLabel:    { en: 'Send to',                              ar: 'إرسال إلى' },
    broadcastAudienceAll:      { en: 'Everyone (community + coaching)',      ar: 'الجميع (المجتمع + التدريب)' },
    broadcastAudienceCommunity:{ en: 'Community only',                       ar: 'المجتمع فقط' },
    broadcastAudienceCoaching: { en: 'Coaching clients only',                ar: 'عملاء التدريب فقط' },
    broadcastSendCta:          { en: 'Send broadcast',                       ar: 'إرسال الإشعار' },
    broadcastSending:          { en: 'Sending…',                             ar: 'يتم الإرسال…' },
    broadcastSent:             { en: 'Broadcast sent.',                      ar: 'تم إرسال الإشعار.' },
    broadcastEmptyError:       { en: 'Write something first.',               ar: 'اكتب شيئاً أولاً.' },
    broadcastFailedError:      { en: 'Could not send. Try again.',           ar: 'تعذّر الإرسال. حاول مجدداً.' },
    broadcastRecentTitle:      { en: 'Recent broadcasts',                    ar: 'الإشعارات الأخيرة' },
    broadcastRecentEmpty:      { en: 'No broadcasts yet.',                   ar: 'لا توجد إشعارات حتى الآن.' },
    broadcastEdit:             { en: 'Edit',                                ar: 'تعديل' },
    broadcastDelete:           { en: 'Delete',                              ar: 'حذف' },
    broadcastSaveEdit:         { en: 'Save',                                ar: 'حفظ' },
    broadcastCancelEdit:       { en: 'Cancel',                              ar: 'إلغاء' },
    broadcastEditedTag:        { en: 'edited',                              ar: 'مُعدّل' },
    broadcastUpdated:          { en: 'Broadcast updated.',                  ar: 'تم تحديث الإشعار.' },
    broadcastUpdateError:      { en: 'Could not update. Try again.',        ar: 'تعذّر التحديث. حاول مجدداً.' },
    broadcastDeleteConfirm:    { en: 'Delete this broadcast?',              ar: 'حذف هذا الإشعار؟' },
    broadcastDeleteYes:        { en: 'Delete',                              ar: 'حذف' },
    broadcastDeleteNo:         { en: 'Keep',                                ar: 'إبقاء' },
    broadcastDeleted:          { en: 'Broadcast deleted.',                  ar: 'تم حذف الإشعار.' },
    broadcastDeleteError:      { en: 'Could not delete. Try again.',        ar: 'تعذّر الحذف. حاول مجدداً.' },
    broadcastEditNote:         { en: 'Editing updates the in-app notification only — it does not re-send the push.', ar: 'التعديل يُحدّث الإشعار داخل التطبيق فقط — لا يُعيد إرسال التنبيه.' },

    notificationsPageTitle:    { en: 'Notifications',                        ar: 'الإشعارات' },
    notificationsPageSub:      { en: 'Every announcement and update from Coach Zaki.',
                                 ar: 'كل الإعلانات والتحديثات من كوتش زاكي.' },
    notificationsEmpty:        { en: 'Nothing yet. New broadcasts from Coach Zaki will show up here.',
                                 ar: 'لا شيء حتى الآن. ستظهر هنا الإشعارات الجديدة من كوتش زاكي.' },
    notificationsBellAria:     { en: 'View notifications',                   ar: 'عرض الإشعارات' },
    notificationsAudienceAll:      { en: 'For everyone',                     ar: 'للجميع' },
    notificationsAudienceCommunity:{ en: 'For community',                    ar: 'للمجتمع' },
    notificationsAudienceCoaching: { en: 'For coaching',                     ar: 'للتدريب' },

    // Dashboard community card — show coach's latest broadcast
    dashCoachBroadcastEyebrow: { en: 'Latest from Coach Zaki',               ar: 'آخر إشعار من كوتش زاكي' },
    dashCoachBroadcastEmpty:   { en: 'Coach Zaki hasn\'t posted a broadcast yet.',
                                 ar: 'لم يرسل كوتش زاكي أي إشعار بعد.' },
    dashCoachName:             { en: 'Coach Zaki',                           ar: 'كوتش زاكي' },

    // Settings — display-name editor
    editName:                  { en: 'Edit name',                            ar: 'تعديل الاسم' },
    editNameSave:              { en: 'Save',                                 ar: 'حفظ' },
    editNameEmptyError:        { en: 'Name cannot be empty.',                ar: 'لا يمكن أن يكون الاسم فارغاً.' },
    editNameTooLongError:      { en: 'Name is too long (max 60 characters).', ar: 'الاسم طويل جداً (60 حرف كحد أقصى).' },
    editNameFailedError:       { en: 'Could not save. Try again.',           ar: 'تعذّر الحفظ. حاول مجدداً.' },

    // ─── Community Updates / WeeklyCheckIn (ProgressPanel.tsx) ────
    updWeeklyHeaderEditable:   { en: 'Update your weight and progress once per week.',
                                 ar: 'حدّث وزنك وتقدّمك مرة في الأسبوع.' },
    updWeeklyHeaderLocked:     { en: 'This week is logged.',
                                 ar: 'تم تسجيل هذا الأسبوع.' },
    updLastSubmitted:          { en: 'Last submitted',                       ar: 'آخر تسجيل' },
    updNextAvailable:          { en: 'Next available',                       ar: 'متاح في' },
    updDontForgetTitle:        { en: 'Don\'t forget to log',                 ar: 'لا تنسَ التسجيل' },
    updDontForgetBody:         { en: 'Update your current weight, log cardio calories for the week, and add a quick note about how it went — these lock with the week.',
                                 ar: 'حدّث وزنك الحالي، سجّل سعرات الكارديو للأسبوع، وأضف ملاحظة سريعة عن سير الأسبوع — تُقفل هذه القيم مع الأسبوع.' },
    updRequiredPill:           { en: 'Required',                             ar: 'مطلوب' },
    updDontForgetPill:         { en: 'Don\'t forget',                       ar: 'لا تنسَ' },
    updCardioRangeHint:        { en: '0–2000 / week',                        ar: '0–2000 / أسبوعياً' },
    updHowDidThisWeekGo:       { en: 'How did this week go? Anything to remember.',
                                 ar: 'كيف كان هذا الأسبوع؟ أي ملاحظات تستحق التذكّر.' },
    updHintEnterWeight:        { en: 'Enter your current weight to submit.',
                                 ar: 'أدخل وزنك الحالي لإرسال التسجيل.' },
    updHintWeightRange:        { en: 'Weight must be between 20 and 350 kg.',
                                 ar: 'يجب أن يكون الوزن بين 20 و 350 كجم.' },
    updHintCardioRange:        { en: 'Cardio calories must be between 0 and 2000.',
                                 ar: 'سعرات الكارديو يجب أن تكون بين 0 و 2000.' },
    updBtnSubmitLockWeek:      { en: 'Submit & lock week',                   ar: 'إرسال وقفل الأسبوع' },
    updBtnSaving:              { en: 'Saving…',                              ar: 'يتم الحفظ…' },
    updBtnSavedOk:             { en: '✓ Saved',                              ar: '✓ تم الحفظ' },
    updBtnLocked:              { en: 'Locked',                               ar: 'مقفل' },
    updSaveFailed:             { en: 'Failed to save. Try again.',           ar: 'فشل الحفظ. حاول مجدداً.' },

    // ─── Body Measurements card ──────────────────────────────────
    measEyebrow:               { en: 'Body Measurements',                    ar: 'قياسات الجسم' },
    measHeader:                { en: 'Beyond the scale.',                    ar: 'ما وراء الميزان.' },
    measChest:                 { en: 'Chest',                                ar: 'الصدر' },
    measWaist:                 { en: 'Waist',                                ar: 'الخصر' },
    measHips:                  { en: 'Hips',                                 ar: 'الأرداف' },
    measArms:                  { en: 'Arms',                                 ar: 'الذراعين' },
    measBtnUpdate:             { en: 'Update measurements',                  ar: 'تحديث القياسات' },
    measBtnSave:               { en: 'Save measurements',                    ar: 'حفظ القياسات' },

    // ─── Photo Gallery — already has progressPhotos; add header ──
    photosHeader:              { en: 'The visible record.',                  ar: 'السجل المرئي.' },

    // ─── ProgressChart — tabbed weekly progress view ──────────────
    chartEyebrow:              { en: 'Weekly progress',                      ar: 'التقدم الأسبوعي' },
    chartHeader:               { en: 'Pick a signal. See its trend.',        ar: 'اختر إشارة. شاهد تطوّرها.' },
    chartTabWeight:            { en: 'Weight',                               ar: 'الوزن' },
    chartTabStrength:          { en: 'Strength',                             ar: 'القوة' },
    chartTabHunger:            { en: 'Hunger',                               ar: 'الجوع' },
    chartTabEnergy:            { en: 'Energy',                               ar: 'الطاقة' },
    chartTabCardio:            { en: 'Cardio',                               ar: 'الكارديو' },
    chartLockedLabel:          { en: 'Locked',                               ar: 'مقفل' },
    chartLastLogged:           { en: 'Last logged',                          ar: 'آخر تسجيل' },
    chartNextAvailable:        { en: 'Next available',                       ar: 'متاح في' },
    chartLastCheckIn:          { en: 'Last check-in',                        ar: 'آخر تسجيل' },
    chartCanLog:               { en: 'You can log this week',                ar: 'يمكنك التسجيل هذا الأسبوع' },
    chartEmpty:                { en: 'Log this week\'s check-in to see the chart.',
                                 ar: 'سجّل تحديث هذا الأسبوع لتظهر الرسوم البيانية.' },
    chartRefStart:             { en: 'Start',                                ar: 'البداية' },
    chartRefGoal:              { en: 'Goal',                                 ar: 'الهدف' },
    chartSeriesWeight:         { en: 'Weight (kg)',                          ar: 'الوزن (كجم)' },
    chartSeriesCardio:         { en: 'Cardio (cal)',                         ar: 'الكارديو (سعرة)' },
    statStart:                 { en: 'Start',                                ar: 'البداية' },
    statCurrent:               { en: 'Current',                              ar: 'الحالي' },
    statGoal:                  { en: 'Goal',                                 ar: 'الهدف' },
    statProgress:              { en: 'Progress',                             ar: 'التقدم' },

    // ─── Settings push notifications diagnostic panel ──────────────
    pushPanelHeader:           { en: 'Push notifications',                   ar: 'الإشعارات الفورية' },
    pushPanelBlurb:            { en: 'Diagnose why pushes aren\'t arriving. All four lines should be green.',
                                 ar: 'شخّص سبب عدم وصول الإشعارات. يجب أن تكون السطور الأربعة باللون الأخضر.' },
    pushPermissionGranted:     { en: 'Notification permission granted',       ar: 'تم منح إذن الإشعارات' },
    pushPermissionDenied:      { en: 'Notifications blocked — open browser settings to re-allow',
                                 ar: 'الإشعارات محظورة — افتح إعدادات المتصفح لإعادة السماح' },
    pushPermissionDefault:     { en: 'Notification permission not yet granted',
                                 ar: 'لم يُمنح إذن الإشعارات بعد' },
    pushPermissionUnsupported: { en: 'Push not supported in this browser',
                                 ar: 'الإشعارات غير مدعومة في هذا المتصفح' },
    pushSwRegistered:          { en: 'Service worker registered',             ar: 'تم تسجيل عامل الخدمة' },
    pushSwNotRegistered:       { en: 'Service worker NOT registered',         ar: 'لم يُسجَّل عامل الخدمة' },
    pushNoDevices:             { en: 'No devices registered — tap Register below',
                                 ar: 'لا توجد أجهزة مسجّلة — اضغط تسجيل بالأسفل' },
    pushDeviceCountSingular:   { en: 'device registered on this account',     ar: 'جهاز مسجّل على هذا الحساب' },
    pushDeviceCountPlural:     { en: 'devices registered on this account',    ar: 'أجهزة مسجّلة على هذا الحساب' },
    pushTestOk:                { en: 'Test push delivered to FCM',            ar: 'تم تسليم إشعار الاختبار إلى FCM' },
    pushTestFail:              { en: 'Test push failed at FCM',               ar: 'فشل إشعار الاختبار في FCM' },
    pushBtnRegister:           { en: 'Register this device',                  ar: 'تسجيل هذا الجهاز' },
    pushBtnRegistering:        { en: 'Registering…',                          ar: 'جاري التسجيل…' },
    pushBtnResetReregister:    { en: 'Reset & re-register',                   ar: 'إعادة الضبط وإعادة التسجيل' },
    pushBtnWipeRegister:       { en: 'Wipe & register only this device',      ar: 'مسح وتسجيل هذا الجهاز فقط' },
    pushBtnSendTest:           { en: 'Send test push',                        ar: 'إرسال إشعار تجريبي' },
    pushBtnSending:            { en: 'Sending…',                              ar: 'جاري الإرسال…' },

    // ─── Community dashboard — Weekly update card ──────────────────
    dashWeeklyUpdateEyebrow:    { en: 'Weekly update',                       ar: 'التحديث الأسبوعي' },
    dashWeeklyUpdateLoggedPfx:  { en: 'Logged',                              ar: 'سُجِّل بتاريخ' },
    dashWeeklyUpdateLogCta:     { en: 'Log weight, signals, and cardio',     ar: 'سجّل الوزن، الإشارات، والكارديو' },
    dashWeeklyUpdateNextOpens:  { en: 'Next update opens',                   ar: 'التحديث التالي يفتح في' },
    dashWeeklyUpdateMinute:     { en: 'Takes one minute and updates your charts.',
                                  ar: 'يستغرق دقيقة واحدة ويحدّث رسومك البيانية.' },
    dashWeeklyUpdatePillLog:    { en: 'Log',                                 ar: 'سجّل' },

    // ─── VideoLibrary / University main tabs ───────────────────────
    tabAcademyPath:            { en: 'Academy Path',                        ar: 'مسار الأكاديمية' },
    tabLiveSessions:           { en: 'Live Sessions',                       ar: 'الجلسات المباشرة' },
    tabTopics:                 { en: 'Topics',                              ar: 'المواضيع' },
    tabManage:                 { en: 'Manage',                              ar: 'إدارة' },

    // ─── Continue Learning hero (Academy landing) — extra keys ───
    // Note: `continueCta` already exists earlier in this file as the
    // dashboard's "Continue" lesson CTA; we reuse it here instead of
    // redefining (which throws TS1117).
    continueLearningEyebrow:   { en: 'Continue learning',                   ar: 'تابع التعلّم' },
    continueNextLabel:         { en: 'Next',                                ar: 'التالي' },

    // ─── Welcome page (post-payment landing for guest signups) ────
    welcomePostPayEyebrow:     { en: 'Payment received',                    ar: 'تم استلام الدفع' },
    welcomePostPayTitle:       { en: 'You\'re almost in.',                  ar: 'أنت على وشك الدخول.' },
    welcomePostPaySub:         { en: 'We just created your account and sent you a link to set your password. Follow the four steps below — you\'ll be inside the app in under 2 minutes.',
                                 ar: 'أنشأنا حسابك للتو وأرسلنا إليك رابطاً لتعيين كلمة المرور. اتبع الخطوات الأربع أدناه — ستكون داخل التطبيق في أقل من دقيقتين.' },

    // Step 1 — check inbox
    welcomeStep1Title:         { en: 'Check your inbox',                    ar: 'تحقّق من بريدك الإلكتروني' },
    welcomeStep1Body:          { en: 'Look for an email from BioZackTeam titled "Reset your password". It usually arrives within 30 seconds of payment.',
                                 ar: 'ابحث عن بريد من بيوزاك تيم بعنوان «إعادة تعيين كلمة المرور». يصل عادةً خلال 30 ثانية من الدفع.' },
    welcomeStep1Hint:          { en: 'Don\'t see it? Check your spam or junk folder — the email comes from noreply@biozackteam-3d593.firebaseapp.com.',
                                 ar: 'لم تجده؟ تحقّق من مجلد البريد المزعج أو الـ Junk — يأتي البريد من noreply@biozackteam-3d593.firebaseapp.com.' },

    // Step 2 — set password
    welcomeStep2Title:         { en: 'Set your password',                   ar: 'اختر كلمة المرور' },
    welcomeStep2Body:          { en: 'Click the secure link inside the email and choose a password (at least 6 characters). Save it somewhere safe — a password manager is best.',
                                 ar: 'اضغط على الرابط الآمن داخل البريد واختر كلمة مرور (6 أحرف على الأقل). احفظها في مكان آمن — يُفضّل استخدام مدير كلمات مرور.' },
    welcomeStep2Hint:          { en: 'The link is one-time use and expires after 1 hour. If it expires, come back here and click "Resend".',
                                 ar: 'الرابط للاستخدام مرة واحدة وينتهي بعد ساعة. إن انتهت صلاحيته، عُد إلى هنا واضغط «إعادة الإرسال».' },

    // Step 3 — sign in
    welcomeStep3Title:         { en: 'Sign in',                             ar: 'سجّل الدخول' },
    welcomeStep3Body:          { en: 'Once your password is set, come back to this site and sign in with your email + new password. Tap the button at the bottom of this page to get there.',
                                 ar: 'بمجرّد تعيين كلمة المرور، عُد إلى هذا الموقع وسجّل الدخول ببريدك الإلكتروني وكلمة المرور الجديدة. اضغط الزر أسفل هذه الصفحة للانتقال إلى تسجيل الدخول.' },
    welcomeStep3Hint:          { en: 'Tip: bookmark app.biozackteam.com so you can come back in one tap from any device.',
                                 ar: 'نصيحة: أضف app.biozackteam.com إلى المفضّلة لتعود في خطوة واحدة من أي جهاز.' },

    // Step 4 — start using the app
    welcomeStep4Title:         { en: 'You\'re in. Start training.',         ar: 'لقد دخلت. ابدأ التدريب.' },
    welcomeStep4Body:          { en: 'Your plan is already active. Your dashboard will show your weekly check-in, training program, diet plan, and the academy — everything ready to go.',
                                 ar: 'باقتك مفعّلة بالفعل. ستعرض لوحتك متابعتك الأسبوعية، برنامج التدريب، الخطّة الغذائية، والأكاديمية — كل شيء جاهز للاستخدام.' },
    welcomeStep4Hint:          { en: 'When asked, allow notifications so you don\'t miss messages from Coach Med.',
                                 ar: 'عند السؤال، اسمح بالإشعارات حتى لا تفوّتك رسائل الكوتش ميد.' },

    // ─── Legal — Terms / Privacy / Health (footer + Settings) ─────
    // Short link labels only — the full document content is hardcoded
    // inside src/pages/Legal.tsx (too long to live alongside UI strings).
    legalSectionEyebrow:       { en: 'Legal',                              ar: 'القانوني' },
    legalTermsLink:            { en: 'Terms of service',                   ar: 'شروط الخدمة' },
    legalPrivacyLink:          { en: 'Privacy policy',                     ar: 'سياسة الخصوصية' },
    legalHealthLink:           { en: 'Health disclaimer',                  ar: 'إخلاء المسؤولية الصحية' },

    // CTAs + support footer
    welcomePostPayCta:         { en: 'Go to sign in',                       ar: 'الانتقال إلى تسجيل الدخول' },
    welcomePostPaySupportTitle:{ en: 'Need help?',                          ar: 'تحتاج إلى مساعدة؟' },
    welcomePostPaySupport:     { en: 'Email never arrived after 5 minutes, or stuck on any step? Email zack@biozack.com and we\'ll help right away.',
                                 ar: 'لم يصل البريد بعد 5 دقائق، أو علقت في إحدى الخطوات؟ راسلنا على zack@biozack.com وسنساعدك فوراً.' },

    // ─── Upgrade success + checkout-open states ───────────────────
    upgradeSuccessEyebrow:     { en: 'Welcome to coaching',                 ar: 'مرحباً بك في التدريب' },
    upgradeSuccessTitle:       { en: 'You\'re in. Med is now your coach.',  ar: 'انضممت. ميد الآن مدرّبك.' },
    upgradeSuccessSub:         { en: 'Direct messaging is unlocked, your weekly check-ins go straight to Med, and your dashboard now shows your coaching surface.',
                                 ar: 'تم تفعيل المراسلة المباشرة، متابعاتك الأسبوعية تذهب مباشرةً إلى ميد، ولوحتك الآن تعرض واجهة التدريب الخاصة بك.' },
    upgradeSuccessCta:         { en: 'Open dashboard',                      ar: 'افتح لوحتي' },
    upgradeOpeningCheckout:    { en: 'Opening checkout…',                   ar: 'يتم فتح صفحة الدفع…' },
    upgradeCheckoutFailed:     { en: 'Could not open checkout. Try again.', ar: 'تعذّر فتح صفحة الدفع. حاول مرة أخرى.' },

    // ─── Manage subscription / customer portal ────────────────────
    subPortalEyebrow:          { en: 'Manage subscription',                  ar: 'إدارة الاشتراك' },
    subPortalBlurb:            { en: 'Update your card, view invoices, or cancel your plan — all in one place.',
                                 ar: 'حدّث بطاقتك، اعرض الفواتير، أو ألغِ خطّتك — كل ذلك في مكان واحد.' },
    subPortalCta:              { en: 'Open subscription manager',            ar: 'فتح إدارة الاشتراك' },
    subPortalOpening:          { en: 'Opening…',                             ar: 'جاري الفتح…' },
    subPortalOpenFailed:       { en: 'Could not open subscription manager. Try again.',
                                 ar: 'تعذّر فتح إدارة الاشتراك. حاول مرة أخرى.' },

    // ─── Coach Subscriptions admin page ───────────────────────────
    navSubscriptions:          { en: 'Subscriptions',                        ar: 'الاشتراكات' },
    subEyebrow:                { en: 'Coach admin',                          ar: 'إدارة الكوتش' },
    subPageTitle:              { en: 'Subscriptions',                        ar: 'الاشتراكات' },
    subPageSub:                { en: 'Every paying member, their plan, their status, and when they next pay.',
                                 ar: 'كل عضو يدفع، خطّته، حالته، وموعد دفعته القادمة.' },
    subFilterAll:              { en: 'All',                                  ar: 'الكل' },
    subStatusActive:           { en: 'Active',                               ar: 'نشط' },
    subStatusPastDue:          { en: 'Past due',                             ar: 'متأخّر السداد' },
    subStatusCanceled:         { en: 'Canceled',                             ar: 'ملغى' },
    subStatusTrialing:         { en: 'Trial',                                ar: 'تجريبي' },
    subStatusDisabled:         { en: 'Disabled',                             ar: 'معطّل' },
    subCancelsAtPeriodEnd:     { en: 'Cancels at period end',                ar: 'يُلغى في نهاية الفترة' },
    subColMember:              { en: 'Member',                               ar: 'العضو' },
    subColTier:                { en: 'Plan',                                 ar: 'الخطّة' },
    subColStatus:              { en: 'Status',                               ar: 'الحالة' },
    subColStarted:             { en: 'Started',                              ar: 'بدأ في' },
    subColNextBill:            { en: 'Next bill',                            ar: 'الدفعة القادمة' },
    subColActions:             { en: 'Actions',                              ar: 'إجراءات' },
    subActionStripe:           { en: 'View in Stripe',                       ar: 'عرض في سترايب' },
    subActionDisable:          { en: 'Disable',                              ar: 'تعطيل' },
    subActionReenable:         { en: 'Re-enable',                            ar: 'إعادة التفعيل' },
    subActionRecover:          { en: 'Get link',                             ar: 'رابط الدخول' },
    subRecoverTitle:           { en: 'Recover member access',                ar: 'استعادة دخول العضو' },
    subRecoverSub:             { en: "Didn't get the welcome email? Generate a set-password link — copy it and send it directly (WhatsApp / Discord), or re-send it as an email.", ar: 'لم يصله بريد الترحيب؟ أنشئ رابط تعيين كلمة المرور — انسخه وأرسله مباشرة (واتساب / ديسكورد)، أو أعد إرساله كبريد إلكتروني.' },
    subRecoverLinkLabel:       { en: 'Set-password link',                    ar: 'رابط تعيين كلمة المرور' },
    subRecoverCopy:            { en: 'Copy',                                 ar: 'نسخ' },
    subRecoverCopied:          { en: 'Copied',                               ar: 'تم النسخ' },
    subRecoverHint:            { en: 'The member opens this link to set their password and sign in. It expires after a while — generate a fresh one if needed.', ar: 'يفتح العضو هذا الرابط لتعيين كلمة المرور وتسجيل الدخول. تنتهي صلاحيته بعد فترة — أنشئ رابطاً جديداً عند الحاجة.' },
    subRecoverGenerating:      { en: 'Generating link…',                     ar: 'جارٍ إنشاء الرابط…' },
    subRecoverError:           { en: 'Could not generate a link. Try again.', ar: 'تعذّر إنشاء الرابط. حاول مجدداً.' },
    subRecoverSendEmail:       { en: 'Send as email',                        ar: 'إرسال كبريد' },
    subRecoverEmailHint:       { en: 'Or email it to them:',                 ar: 'أو أرسله إليه بالبريد:' },
    subRecoverEmailSent:       { en: 'Email sent',                           ar: 'تم إرسال البريد' },
    subRecoverEmailFailed:     { en: 'Email failed — use the link instead',  ar: 'فشل البريد — استخدم الرابط بدلاً منه' },
    subActionFailed:           { en: 'Action failed. See console for details.',
                                 ar: 'فشل الإجراء. راجع وحدة التحكّم لمزيد من التفاصيل.' },
    subEmptyState:             { en: 'No subscribers yet match this filter.',
                                 ar: 'لا يوجد مشتركون يطابقون هذا الفلتر بعد.' },

    // Link-cash-client flow (Subscriptions admin → modal)
    subLinkCashClient:         { en: 'Link cash client',                     ar: 'ربط عميل نقدي' },
    subLinkEyebrow:            { en: 'Cash → Stripe',                        ar: 'نقداً ← سترايب' },
    subLinkTitle:              { en: 'Link existing client to Stripe',       ar: 'ربط عميل حالي بسترايب' },
    subLinkPickClient:         { en: 'Pick the client',                      ar: 'اختر العميل' },
    subLinkSearchPlaceholder:  { en: 'Search by name or email…',             ar: 'ابحث بالاسم أو البريد الإلكتروني…' },
    subLinkNoCandidates:       { en: 'No matching clients available to link.', ar: 'لا يوجد عملاء مطابقون للربط.' },
    subLinkPickPlan:           { en: 'Pick the plan',                        ar: 'اختر الخطّة' },
    subLinkPlanCommunity:      { en: 'Community access',                     ar: 'وصول للمجتمع' },
    subLinkPlanCoaching:       { en: 'One-on-one coaching with Med',         ar: 'تدريب فردي مع ميد' },
    subLinkBillingStartDate:   { en: 'First auto-charge date',               ar: 'تاريخ أوّل خصم تلقائي' },
    subLinkBillingStartHint:   { en: 'The client gets full app access today. Stripe charges their card automatically on this date — set it to the day their cash-paid period ends.',
                                 ar: 'يحصل العميل على وصول كامل للتطبيق اليوم. سيقوم سترايب بخصم البطاقة تلقائياً في هذا التاريخ — اضبطه على اليوم الذي تنتهي فيه فترة الدفع النقدي.' },
    subLinkNoteOptional:       { en: 'Note (optional, internal only)',       ar: 'ملاحظة (اختيارية، داخلية فقط)' },
    subLinkNotePlaceholder:    { en: 'e.g. paid 500 USD cash for 3 months',  ar: 'مثال: دفع 500 دولار نقداً لـ 3 أشهر' },
    subLinkAllFieldsRequired:  { en: 'Pick a client, a plan, and a start date.',
                                 ar: 'اختر عميلاً، خطّة، وتاريخ بداية.' },
    subLinkGenerate:           { en: 'Generate Checkout link',               ar: 'إنشاء رابط الدفع' },
    subLinkFailed:             { en: 'Could not generate link. Try again.',  ar: 'تعذّر إنشاء الرابط. حاول مرة أخرى.' },
    subLinkSuccessBlurb:       { en: 'Send this link to the client. They open it, enter their card, and Stripe takes care of the rest. Auto-billing starts on the date you set.',
                                 ar: 'أرسل هذا الرابط للعميل. يفتحه، يُدخل بطاقته، ويتولّى سترايب الباقي. تبدأ الفوترة التلقائية في التاريخ الذي اخترته.' },
    subLinkCheckoutUrl:        { en: 'Checkout URL',                         ar: 'رابط الدفع' },
    subLinkExpiresHint:        { en: 'The link is valid for ~24 hours. Generate a new one if the client doesn\'t open it in time.',
                                 ar: 'الرابط صالح لمدة 24 ساعة تقريباً. أنشئ رابطاً جديداً إذا لم يفتحه العميل في الوقت المناسب.' },
    copied:                    { en: 'Copied',                               ar: 'تم النسخ' },
    copy:                      { en: 'Copy',                                 ar: 'نسخ' },

    // ─── Inline upgrade offer (Profile page, community users) ──────
    upgradeYourPlanEyebrow:    { en: 'Your plan',                            ar: 'باقتك الحالية' },
    upgradeOfferEyebrow:       { en: 'Your next chapter',                    ar: 'فصلك التالي' },
    upgradeOfferTitle:         { en: 'Stop training alone.',                 ar: 'كفى تدرّباً وحدك.' },
    upgradeOfferSub:           { en: 'You\'ve watched the videos. You\'ve logged the weeks. You know what\'s missing — someone who sees YOUR body, knows YOUR plateaus, and builds the plan around YOU. That\'s coaching with Med.',
                                 ar: 'شاهدت الفيديوهات. سجّلت أسابيعك. تعرف ما الذي ينقصك — شخص يرى جسمك أنت، يعرف ثبات وزنك أنت، ويبني الخطّة من حولك أنت. هذا هو التدريب مع ميد.' },
    upgradeYouHave:            { en: 'On the community plan',                ar: 'في باقة المجتمع' },
    upgradeYouGet:             { en: 'The day you upgrade',                  ar: 'يوم ترقّيك' },

    // Three emotional benefits — each frames the unlock as
    // transformation, not feature. (Priority response benefit dropped
    // per founder direction: avoid "daily replies" framing.)
    upgradeBenefit1Title:      { en: 'A coach who knows YOUR name',          ar: 'كوتش يعرف اسمك أنت' },
    upgradeBenefit1Sub:        { en: 'Not a chatbot. Not a forum. Med reads what you write, remembers your check-ins, and replies to the human behind the screen.',
                                 ar: 'ليس روبوتاً. وليس منتدى. ميد يقرأ ما تكتبه، يتذكّر متابعاتك، ويرد على الإنسان خلف الشاشة.' },
    upgradeBenefit2Title:      { en: 'A plan made FOR your body',            ar: 'خطّة مصمَّمة لجسمك أنت' },
    upgradeBenefit2Sub:        { en: 'No more cookie-cutter routines. Your training, your macros, your timing — all built around the numbers you log each week.',
                                 ar: 'لا مزيد من البرامج العامة. تدريبك، ماكروزك، توقيتك — كل شيء مبني على الأرقام التي تسجّلها كل أسبوع.' },
    upgradeBenefit3Title:      { en: 'Someone in your corner every week',    ar: 'شخص بجانبك في كل أسبوع' },
    upgradeBenefit3Sub:        { en: 'Med opens every check-in. He adjusts what isn\'t working, doubles down on what is, and tells you the next move. You stop guessing.',
                                 ar: 'ميد يفتح كل متابعة. يعدّل ما لا يعمل، يضاعف ما يعمل، ويخبرك بالخطوة التالية. لا تخمين بعد الآن.' },

    upgradePriceMonthly:       { en: '/ month',                              ar: '/ شهرياً' },
    // Replaces the old "Cancel anytime…" line — founder direction
    // says avoid refund/cancellation framing entirely. This line
    // closes on the emotional contrast instead.
    upgradeBilledNote:         { en: 'Everything you have today — plus Med in your corner.',
                                 ar: 'كل ما لديك اليوم — بالإضافة إلى ميد بجانبك.' },
    upgradeCta:                { en: 'Start coaching with Med',              ar: 'ابدأ التدريب مع ميد' },
    upgradeProofLine:          { en: 'Trusted by people who finally got the body they were chasing.',
                                 ar: 'يثق به أشخاص حصلوا أخيراً على الجسم الذي كانوا يلاحقونه.' },

    // ─── Welcome / pre-login landing ────────────────────────────────
    welcomeEyebrow:            { en: 'BioZackTeam',                          ar: 'بيوزاك تيم' },
    welcomeTagline:            { en: 'Where strength meets science.',        ar: 'حيث تلتقي القوّة بالعلم.' },
    welcomeHeroTitle:          { en: 'The body you\'ve been chasing — built with a coach who\'s been there.',
                                 ar: 'الجسم الذي تسعى إليه — تبنيه مع كوتش سلك الطريق قبلك.' },
    welcomeHeroSub:            { en: 'Coach Med\'s full fitness platform — academy lessons, custom programs, calibrated diets, and one-on-one coaching for the members who want results, not advice.',
                                 ar: 'منصّة الكوتش ميد المتكاملة للياقة — دروس الأكاديمية، برامج مخصّصة، خطط غذائية معدّلة، وتدريب فردي للأعضاء الذين يريدون نتائج، لا نصائح.' },
    welcomeCtaSignIn:          { en: 'Sign in',                              ar: 'تسجيل الدخول' },
    welcomeCtaSeePlans:        { en: 'See plans',                            ar: 'استعرض الباقات' },

    // What's inside
    welcomeInsideEyebrow:      { en: 'What\'s inside',                       ar: 'ما الذي بالداخل' },
    welcomeInsideTitle:        { en: 'Everything you need under one roof.',  ar: 'كل ما تحتاجه تحت سقف واحد.' },
    welcomeInside1Title:       { en: 'BioZackTeam University',                ar: 'جامعة بيوزاك تيم' },
    welcomeInside1Sub:         { en: 'Beginner → Advanced lessons mapped into a real curriculum. You start at the bottom and you finish at the top — no skipping.',
                                 ar: 'دروس من المبتدئ إلى المتقدم في منهج حقيقي. تبدأ من الأساس وتُنهي في القمّة — بلا قفز.' },
    welcomeInside2Title:       { en: 'Training programs that fit your goal', ar: 'برامج تدريب تلائم هدفك' },
    welcomeInside2Sub:         { en: '100+ pre-built rotations sorted by goal — fat loss, recomp, strength, endurance. Pick one and follow it.',
                                 ar: 'أكثر من 100 برنامج جاهز مرتّبة حسب الهدف — حرق دهون، تنشيف، قوّة، تحمّل. اختر واحداً واتبعه.' },
    welcomeInside3Title:       { en: 'Diet plans tuned to YOUR body',        ar: 'خطط غذائية مضبوطة على جسمك' },
    welcomeInside3Sub:         { en: 'Calorie tiers + macro splits + meal counts adjusted to your weekly check-ins. Real food, real measurements.',
                                 ar: 'سعرات حرارية وتقسيم ماكروز وعدد وجبات معدّلة حسب متابعاتك الأسبوعية. أكل حقيقي وقياسات حقيقية.' },
    welcomeInside4Title:       { en: 'Coach Med, in your corner',            ar: 'كوتش ميد، بجانبك' },
    welcomeInside4Sub:         { en: 'For coaching clients: direct messages, weekly reviews, custom protocols. For community: the academy and the team feed.',
                                 ar: 'لعملاء التدريب: رسائل مباشرة ومراجعات أسبوعية وبروتوكولات مخصّصة. للمجتمع: الأكاديمية وفيد الفريق.' },

    // Social proof
    welcomeProofEyebrow:       { en: 'Real members. Real results.',          ar: 'أعضاء حقيقيون. نتائج حقيقية.' },
    welcomeStatMembers:        { en: 'Members',                              ar: 'عضواً' },
    welcomeStatCountries:      { en: 'Countries',                            ar: 'دول' },
    welcomeStatPrograms:       { en: 'Programs',                             ar: 'برنامجاً' },

    // How it works
    welcomeHowEyebrow:         { en: 'How it works',                         ar: 'كيف يعمل' },
    welcomeHow1Title:          { en: 'Sign in & pick your goal',             ar: 'سجّل دخولك واختر هدفك' },
    welcomeHow1Sub:            { en: 'A 30-second baseline tells the app where you are today.',
                                 ar: 'إعدادات أوّلية بسرعة 30 ثانية تخبر التطبيق بنقطتك الحالية.' },
    welcomeHow2Title:          { en: 'Train, eat, log your week',            ar: 'تدرّب، تناول، وسجّل أسبوعك' },
    welcomeHow2Sub:            { en: 'Follow the plan. Log weight, photos, and how you felt.',
                                 ar: 'اتبع الخطّة. سجّل وزنك وصورك وكيف شعرت.' },
    welcomeHow3Title:          { en: 'Review & adjust each week',            ar: 'راجع وعدّل كل أسبوع' },
    welcomeHow3Sub:            { en: 'Coach Med reads your check-in (coaching tier) or your charts move (community).',
                                 ar: 'يقرأ الكوتش ميد متابعتك (باقة التدريب) أو تتحدّث رسومك (المجتمع).' },

    // Final call-to-action strip near the form
    welcomeReadyEyebrow:       { en: 'Ready?',                               ar: 'جاهز؟' },
    welcomeReadyTitle:         { en: 'Step inside.',                         ar: 'ادخل.' },
    welcomeReadySub:           { en: 'Already a member? Sign in. New here? Pick a plan first, then come back to log in.',
                                 ar: 'هل أنت عضو؟ سجّل دخولك. جديد هنا؟ اختر باقتك أولاً، ثم عُد لتسجيل الدخول.' },

    // ─── University level cards ────────────────────────────────────
    universityLevelLabel:      { en: 'Level',                                ar: 'المستوى' },
    universityOpenLabel:       { en: 'Open',                                 ar: 'افتح' },
    universityBeginner:        { en: 'Beginner',                             ar: 'مبتدئ' },
    universityIntermediate:    { en: 'Intermediate',                         ar: 'متوسط' },
    universityAdvanced:        { en: 'Advanced',                             ar: 'متقدم' },
    universityTopics:          { en: 'Topics',                               ar: 'مواضيع' },
    universityBeginnerTag:     { en: 'Starting the journey',                 ar: 'بداية الرحلة' },
    universityIntermediateTag: { en: 'Building skills & growing',            ar: 'بناء المهارات والنمو' },
    universityAdvancedTag:     { en: 'Teaching & leading others',            ar: 'التدريس وقيادة الآخرين' },
    universityTopicsTag:       { en: 'Off-path',                             ar: 'خارج المسار' },
    universityCourseSingular:  { en: 'course',                               ar: 'دورة' },
    universityCoursePlural:    { en: 'courses',                              ar: 'دورات' },
    universityFollowOrder:     { en: 'Follow the path in order — finish one level before moving to the next.',
                                 ar: 'اتبع المسار بالترتيب — أكمل كل مستوى قبل الانتقال للتالي.' },
    universityCollections:     { en: 'Collections',                          ar: 'المجموعات' },

} as const;

export type TranslationKey = keyof typeof translations;
