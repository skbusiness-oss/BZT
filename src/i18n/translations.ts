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
    navVideoLibrary: { en: 'Video Library', ar: 'مكتبة الفيديو' },
    navWorkouts: { en: 'Workouts', ar: 'التمارين' },
    navProfile: { en: 'Profile', ar: 'الملف الشخصي' },

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

    // --- Video Library ---
    videoLibraryTitle: { en: 'Video Library', ar: 'مكتبة الفيديو' },
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
    profileTitle: { en: 'Profile', ar: 'الملف الشخصي' },
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
    navSettings: { en: 'Settings', ar: 'الإعدادات' },
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
    communityMemberFree: { en: 'Community member (free)', ar: 'عضو مجتمع (مجاني)' },
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
    settingsTitle: { en: 'Settings', ar: 'الإعدادات' },
    settingsSubtitle: { en: 'Preferences and account.', ar: 'التفضيلات والحساب.' },
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
    academyTitle: { en: 'Academy', ar: 'الأكاديمية' },
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

} as const;

export type TranslationKey = keyof typeof translations;
