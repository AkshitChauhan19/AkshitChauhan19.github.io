export interface ProjectItem {
  id: string;
  index: string;
  title: string;
  displayTitle: string;
  category: string;
  year: string;
  role: string;
  status?: string;
  shortDescription: string;
  overview: string;
  highlights: string[];
  techStack: string[];
  image: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  repoUrl: string;
  liveLabel: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  type: string;
  location: string;
  period: string;
  highlights: string[];
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export const PERSONAL_INFO = {
  fullName: 'Akshit Chauhan',
  brandMark: 'Akshit.',
  monogram: 'A.',
  monogramLetter: 'A',
  headline: 'Flutter & Android Developer',
  subHeadline: 'B.Tech CSE (Artificial Intelligence)',
  location: 'Meerut',
  locationShort: 'Meerut',
  phone: '+91 9696941109',
  phoneHref: 'tel:+919696941109',
  whatsappNumber: '919696941109',
  email: 'akshitch5421@gmail.com',
  emailHref: 'mailto:akshitch5421@gmail.com',
  githubUrl: 'https://github.com/AkshitChauhan19',
  linkedinUrl: 'https://www.linkedin.com/in/akshit-chauhan1',
  resumeUrl: '/Akshit_Chauhan_Resume.pdf',
  resumeFileName: 'Akshit_Chauhan_Resume.pdf',
  status: 'Available',
  heroCaption: 'Code Crafted With Precision',
  heroHeadline: 'ENGINEERING INTELLIGENT APPS',
  bioParagraph1:
    "Hi! I'm Akshit Chauhan — a Flutter & Android Developer from Meerut, pursuing B.Tech in Computer Science & Engineering (Artificial Intelligence). I bring production experience building cross-platform Flutter/Dart and native Android (Kotlin, Jetpack Compose) applications — spanning REST API authentication, token lifecycle management, live geolocation tracking with foreground services, MVVM architecture, and Room database.",
  bioParagraph2:
    'I focus on writing clean, maintainable, production-ready code for scalable mobile apps — transforming product concepts into responsive, pixel-perfect Material 3 experiences.',
  marqueeItems: [
    'Flutter & Dart',
    'Jetpack Compose',
    'MVVM Architecture',
    'Live Geolocation Tracking',
    'REST & JWT Authentication',
    'Clean Scalable Mobile Apps',
  ],
};

export const EXPERIENCE: ExperienceItem[] = [
  {
    company: '30Days Technologies Pvt. Ltd.',
    role: 'Software Developer Intern (Flutter Developer)',
    type: 'Internship',
    location: 'Bahadurgarh, Haryana',
    period: 'Aug 2026 – Nov 2026',
    highlights: [
      'Engineered a secure authentication module integrating backend REST APIs; implemented token-based auth monitoring with automatic session verification and redirection to login on token expiration.',
      'Implemented real-time live location tracking and background geolocation updates by integrating Google Maps SDK, Geolocator, and Android Foreground Services.',
      'Structured clean application workflows using Bloc / Provider state management, ensuring smooth reactive UI rendering and separation of business logic.',
      'Designed and developed pixel-perfect, responsive cross-platform screens and reusable custom Flutter widgets following Material 3 design principles.',
    ],
  },
];

export const EDUCATION = {
  institution: 'Meerut Institute of Engineering and Technology (MIET)',
  degree: 'B.Tech CSE (Artificial Intelligence)',
  cgpa: '7.98 / 10 (up to 6th Semester)',
  location: 'Meerut',
  period: 'Expected 2027',
  schooling: [
    { label: 'Class XII, CBSE', score: '81%' },
    { label: 'Class X, CBSE', score: '88%' },
  ],
};

export const TECHNICAL_SKILLS: SkillGroup[] = [
  {
    category: 'Languages',
    items: ['Dart', 'Kotlin', 'Java', 'Python', 'SQL (Basic)'],
  },
  {
    category: 'Flutter & Android',
    items: [
      'Flutter',
      'Jetpack Compose',
      'MVVM',
      'Bloc',
      'Provider',
      'Retrofit',
      'Room',
      'Coroutines',
      'Flow',
      'StateFlow',
      'Android Foreground Services',
      'Geolocator',
      'Google Maps SDK',
      'Material 3',
      'Navigation Compose',
    ],
  },
  {
    category: 'APIs & Cloud',
    items: ['RESTful APIs', 'Token-based Auth (JWT)', 'Firebase Authentication (Native)'],
  },
  {
    category: 'Currently Learning',
    items: ['Firebase Firestore', 'Firebase Cloud Storage'],
  },
  {
    category: 'ML / AI',
    items: ['NLP', 'Scikit-Learn', 'NumPy', 'Pandas', 'NLTK', 'Matplotlib'],
  },
  {
    category: 'Tools & Platforms',
    items: ['Android Studio', 'VS Code', 'Git', 'GitHub', 'Gradle', 'Postman'],
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'geopulse',
    index: '0 1',
    title: 'GeoPulse',
    displayTitle: 'GEOPULSE',
    category: 'FLUTTER · HRM & LIVE GPS',
    year: '2026',
    role: 'Flutter Developer Intern',
    status: 'Production',
    shortDescription:
      'Production Flutter HRM Portal featuring real-time GPS location tracking with Android Foreground Services, attendance history, automated JWT session lifecycle monitoring, and Material 3 custom widgets.',
    overview:
      'Built during my Software Developer Internship at 30Days Technologies Pvt. Ltd. GeoPulse is a cross-platform Flutter HRM Portal combining resilient JWT token lifecycle verification, continuous real-time GPS tracking and attendance history via Android Foreground Services, and modular Bloc/Provider state workflows.',
    highlights: [
      'Engineered a secure authentication module integrating backend REST APIs with token-based auth monitoring, automatic session verification, and instant login redirection upon token expiration.',
      'Built real-time live GPS location tracking, attendance history workflows, and persistent background geolocation updates powered by Google Maps SDK, Geolocator, and Android Foreground Services.',
      'Architected clean reactive workflows with Bloc and Provider state management to keep UI rendering smooth and business logic cleanly decoupled.',
      'Crafted pixel-perfect, responsive cross-platform layouts and reusable custom Flutter widgets aligned with Material 3 design principles.',
    ],
    techStack: [
      'Flutter',
      'Dart',
      'Bloc / Provider',
      'Google Maps SDK',
      'Geolocator',
      'Android Foreground Services',
      'REST APIs',
      'JWT Auth',
      'Material 3',
    ],
    image: '/images/project-30days.jpg',
    accentColor: '#38bdf8',
    gradientFrom: '#a8edea',
    gradientTo: '#fed6e3',
    repoUrl: 'https://github.com/AkshitChauhan19/GeoPulse-App',
    liveLabel: 'Explore on GitHub',
  },
  {
    id: 'med-reminder',
    index: '0 2',
    title: 'MedReminder',
    displayTitle: 'MEDREMINDER',
    category: 'KOTLIN · CLEAN ARCH · ROOM',
    year: '2026',
    role: 'Android Developer',
    status: 'In Progress',
    shortDescription:
      'Smart medication tracker and health companion built with Kotlin, Jetpack Compose, Material 3, Clean Architecture, Room database, and Firebase for reliable offline-first dosage reminders.',
    overview:
      'Currently in active development — MedReminder is an offline-first smart medication tracker and health companion engineered with Jetpack Compose, Material 3, Clean Architecture, Room Database, and Firebase to keep prescription schedules and dosage history dependable with timely background notification reminders.',
    highlights: [
      'Developing a persistent medication schedule and dosage history layer using Android Room Database paired with Firebase integration for reliable tracking.',
      'Implementing Clean Architecture & MVVM with Kotlin Coroutines and reactive Flow streams for real-time schedule observation.',
      'Building background scheduling and notification-based reminder triggers to ensure timely daily medication alerts.',
      'Crafting calm, high-legibility Material 3 Jetpack Compose interfaces tailored for effortless daily health check-ins.',
    ],
    techStack: [
      'Kotlin',
      'Jetpack Compose',
      'Material 3',
      'Clean Architecture',
      'MVVM',
      'Room Database',
      'Firebase',
      'Coroutines',
      'Flow',
    ],
    image: '/images/project-medreminder.jpg',
    accentColor: '#34d399',
    gradientFrom: '#d4fc79',
    gradientTo: '#96e6a1',
    repoUrl: 'https://github.com/AkshitChauhan19/MedReminder',
    liveLabel: 'Explore on GitHub',
  },
  {
    id: 'lungvision-ai',
    index: '0 3',
    title: 'LungVision AI',
    displayTitle: 'LUNGVISION AI',
    category: 'DEEP LEARNING · MEDICAL XAI',
    year: '2026',
    role: 'AI / Deep Learning Developer',
    shortDescription:
      'Dual-Attention Deep Learning framework (EfficientNet-B1 + CBAM) with Multi-Center Domain Adaptation, ACR Lung-RADS v2022 calibration, and Grad-CAM explainable AI for thoracic CT lung cancer screening.',
    overview:
      'LungVision AI is a clinical-grade deep learning framework designed for thoracic CT lung cancer screening. It pairs an EfficientNet-B1 backbone with Convolutional Block Attention Modules (CBAM), multi-center domain adaptation for cross-hospital generalization, ACR Lung-RADS v2022 risk calibration, and Grad-CAM visual explainability.',
    highlights: [
      'Architected a Dual-Attention deep learning pipeline combining EfficientNet-B1 with CBAM (Channel & Spatial Attention) to focus precisely on subtle pulmonary nodules in thoracic CT slices.',
      'Integrated Multi-Center Domain Adaptation techniques to improve diagnostic robustness and generalization across diverse CT scanner protocols and clinical cohorts.',
      'Aligned model probability calibration and risk stratification with ACR Lung-RADS v2022 clinical screening standards.',
      'Implemented Grad-CAM Explainable AI (XAI) heatmaps to provide transparent, visually interpretable localization overlays for clinical review.',
    ],
    techStack: [
      'Python',
      'Deep Learning',
      'EfficientNet-B1',
      'CBAM Attention',
      'Domain Adaptation',
      'ACR Lung-RADS v2022',
      'Grad-CAM XAI',
      'Medical Imaging',
    ],
    image: '/images/project-lungvision.jpg',
    accentColor: '#f43f5e',
    gradientFrom: '#fbc2eb',
    gradientTo: '#a6c1ee',
    repoUrl: 'https://github.com/AkshitChauhan19/LungVision-AI',
    liveLabel: 'Explore on GitHub',
  },
  {
    id: 'spam-classifier',
    index: '0 4',
    title: 'Spam Message Classifier',
    displayTitle: 'SPAM CLASSIFIER',
    category: 'PYTHON · NLP · CONTRIBUTION',
    year: '2026',
    role: 'Contributor (Coding)',
    status: 'Contribution',
    shortDescription:
      'Collaborative NLP spam classification project where I contributed the core coding implementation — stopword removal, stemming, CountVectorizer, Multinomial Naive Bayes, and Matplotlib evaluation reporting.',
    overview:
      'A collaborative Natural Language Processing project to filter SMS and message spam accurately. My role was focused purely on the coding implementation — building the text preprocessing pipeline, Multinomial Naive Bayes modeling, and visual evaluation metrics in Python.',
    highlights: [
      'Contributed the core Python coding implementation for the end-to-end NLP preprocessing pipeline (tokenization, stopword removal, and word stemming with NLTK).',
      'Implemented feature extraction with Scikit-Learn CountVectorizer and trained the Multinomial Naive Bayes classification model.',
      'Coded model validation and metric evaluation workflows (precision, recall, F1-score, and confusion matrix analysis).',
      'Built Matplotlib visualizations for prediction results and model evaluation reporting.',
    ],
    techStack: ['Python', 'NLP', 'Scikit-Learn', 'NLTK', 'CountVectorizer', 'Naive Bayes', 'Pandas', 'Matplotlib'],
    image: '/images/project-spam-classifier.jpg',
    accentColor: '#a78bfa',
    gradientFrom: '#cfd9df',
    gradientTo: '#e2ebf0',
    repoUrl: 'https://github.com/Aditya-dev-1/spam-message-classifier',
    liveLabel: 'Explore on GitHub',
  },
  {
    id: 'weather-app',
    index: '0 5',
    title: 'Weather App',
    displayTitle: 'WEATHER APP',
    category: 'KOTLIN · JETPACK COMPOSE',
    year: '2026',
    role: 'Android Developer',
    shortDescription:
      'Real-time native Android weather application fetching live meteorological data via Retrofit REST APIs and rendering responsive updates with Jetpack Compose, MVVM, Coroutines, and StateFlow.',
    overview:
      'A sleek native Android weather experience engineered in Kotlin with declarative Jetpack Compose UI. Designed around unidirectional data flow so network latency, loading states, and live weather refreshes render effortlessly with zero frame drops.',
    highlights: [
      'Built a real-time weather application fetching live atmospheric and forecast data from a REST API using Retrofit.',
      'Designed a responsive, fluid Jetpack Compose UI adapting cleanly across Android screen densities and form factors.',
      'Structured the codebase strictly around MVVM architecture, isolating data repositories from UI presentation.',
      'Leveraged Kotlin Coroutines and StateFlow to manage asynchronous API calls and reactive UI state updates safely across lifecycle changes.',
    ],
    techStack: ['Kotlin', 'Jetpack Compose', 'MVVM', 'Retrofit', 'Coroutines', 'StateFlow', 'Material 3'],
    image: '/images/project-weather.jpg',
    accentColor: '#60a5fa',
    gradientFrom: '#c2e9fb',
    gradientTo: '#e2d1f9',
    repoUrl: 'https://github.com/AkshitChauhan19',
    liveLabel: 'Explore on GitHub',
  },
];
