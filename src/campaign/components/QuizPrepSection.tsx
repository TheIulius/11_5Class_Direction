import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ExternalLink,
  Headphones,
  Video,
  FileText,
  HelpCircle,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Send,
  BookOpen,
  Layers,
  Flame,
  Volume2,
  ArrowRight,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

type StudioTab = 'overview' | 'podcast' | 'quiz' | 'flashcards' | 'chat';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  tag: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: string[];
}

// Default NotebookLM share URL placeholder — can be updated when the user shares their notebook link
const DEFAULT_NOTEBOOKLM_URL = 'https://notebooklm.google.com/';

const INITIAL_STUDY_NOTES = [
  {
    id: 'note-1',
    title: '1. ტექსტის მხატვრული ანალიზი და მთავარი სათქმელი',
    badge: 'ძირითადი საკითხი',
    points: [
      'ავტორისეული პოზიცია და პერსონაჟთა დახასიათების ხერხები (პირდაპირი და ირიბი დახასიათება).',
      'ტროპული მეტყველება: მეტაფორა, ეპითეტი, შედარება, გაპიროვნება და სიმბოლო-ალეგორია.',
      'ციტატის მოყვანისა და არგუმენტირებული მსჯელობის სტრუქტურა ქვიზის ღია კითხვებში.'
    ]
  },
  {
    id: 'note-2',
    title: '2. ისტორიულ-ლიტერატურული კონტექსტი და ეპოქა',
    badge: 'კონტექსტი',
    points: [
      'ნაწარმოების შექმნის ეპოქალური ფონი და მისი გავლენა ტექსტის პრობლემატიკაზე.',
      'პარალელების გავლება სხვა ნასწავლ ქართულ ტექსტებთან (თემატური და იდეური მსგავსება).',
      'საკვანძო ტერმინებისა და ლექსიკური ერთეულების ზუსტი განმარტება.'
    ]
  },
  {
    id: 'note-3',
    title: '3. სტილისტიკა, მართლწერა და სინტაქსური კონსტრუქციები',
    badge: 'გრამატიკა & სტილი',
    points: [
      'პუნქტუაციის წესები რთულ ქვეწყობილ და თანწყობილ წინადადებებში.',
      'სტილისტური ხარვეზების გასწორება (ტავტოლოგია, კალკი, ბარბარიზმი, რიცხვში შეთანხმება).',
      'ზმნის პირიანობა და სწორი მორფოლოგიური ფორმები.'
    ]
  }
];

const INITIAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'ლიტერატურის თეორია',
    question: 'რომელი მხატვრული ხერხია გამოყენებული, როდესაც უსულო საგანს ან ბუნების მოვლენას ადამიანური თვისებები მიეწერება?',
    options: [
      'ჰიპერბოლა',
      'გაპიროვნება (პერსონიფიკაცია)',
      'ლიტოტესი',
      'ალიტერაცია'
    ],
    correctIndex: 1,
    explanation: 'გაპიროვნება (პერსონიფიკაცია) არის ტროპის სახე, რომლის დროსაც უსულო საგანი ან მოვლენა წარმოდგენილია ცოცხალ, მოაზროვნე და მგრძნობიარე არსებად.'
  },
  {
    id: 'q2',
    category: 'ტექსტის ანალიზი',
    question: 'რა განსხვავებაა შედარებასა და მეტაფორას შორის ქართულ ლიტერატურათმცოდნეობაში?',
    options: [
      'მეტაფორაში ორივე წევრი (შესადარებელი და შედარებული) დაკავშირებულია „ვითარცა“ ან „როგორც“ კავშირით',
      'შედარებაში გამოყენებულია შედარებითი კავშირები/ნაწილაკები (-ვით, როგორც, თითქოს), ხოლო მეტაფორა ფარული შედარებაა კავშირის გარეშე',
      'შედარება მხოლოდ პოეზიაში გვხვდება, მეტაფორა კი მხოლოდ პროზაში',
      'მათ შორის განსხვავება არ არსებობს'
    ],
    correctIndex: 1,
    explanation: 'მეტაფორა არის „შემოკლებული/ფარული შედარება“, სადაც გამოტოვებულია შედარებითი კავშირი („როგორც“, „თითქოს“, „-ვით“) და საგანს პირდაპირ გადაეცემა სხვა საგნის ნიშანი.'
  },
  {
    id: 'q3',
    category: 'მართლწერა და სინტაქსი',
    question: 'რომელ წინადადებაშია დაცული სუბიექტისა და შემასმენლის რიცხვში შეთანხმების ნორმა?',
    options: [
      'მოსწავლეებმა წარმატებით დაწერეს ქართულის ქვიზი.',
      'უამრავი წიგნები ეწყო მაგიდაზე.',
      'ყველა მოსწავლეები დროულად გამოცხადდნენ.',
      'რამდენიმე საკითხები განსაკუთრებულ ყურადღებას მოითხოვს.'
    ],
    correctIndex: 0,
    explanation: 'სულიერი ქვემდებარის მრავლობით რიცხვში ყოფნისას („მოსწავლეებმა“) შემასმენელიც მრავლობითში დგება („დაწერეს“), ხოლო მსაზღვრელებთან „უამრავი“, „ყველა“, „რამდენიმე“ არსებითი სახელი მხოლობით რიცხვში უნდა იდგეს.'
  },
  {
    id: 'q4',
    category: 'ქვიზის სტრატეგია',
    question: 'როგორ უნდა აიგოს სრულყოფილი პასუხი ღია (სააზროვნო) კითხვაზე მაქსიმალური ქულის მისაღებად?',
    options: [
      'მხოლოდ მოკლე ციტატის დაწერით განმარტების გარეშე',
      'თეზისი (მთავარი პასუხი) → ტექსტური არგუმენტი/ციტატა → მხატვრული ხერხის ან კონტექსტის დასკვნითი განზოგადება',
      'სიუჟეტის დეტალური пересказ-ით (შინაარსის მოყოლით)',
      'მხოლოდ ავტორის ბიოგრაფიის მიმოხილვით'
    ],
    correctIndex: 1,
    explanation: 'თ. თვალჭრელიძის შეფასების კრიტერიუმებით, უმაღლესი ქულა იწერება მაშინ, როცა მოსწავლე აყალიბებს მკაფიო თეზისს, ამყარებს მას ტექსტური ციტატით და ხსნის მის მხატვრულ დატვირთვას.'
  }
];

const INITIAL_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    tag: 'ტროპი',
    front: 'რა არის ალეგორია?',
    back: 'ქარაგმული თხრობა, სადაც განყენებული იდეა ან ადამიანური თვისება გადმოცემულია კონკრეტული სახის (ხშირად ცხოველის ან ბუნების მოვლენის) მეშვეობით.'
  },
  {
    id: 'fc-2',
    tag: 'კომპოზიცია',
    front: 'რას ნიშნავს ნაწარმოების კულმინაცია და კვანძის გახსნა?',
    back: 'კულმინაცია არის მოქმედების განვითარების უმაღლესი, ყველაზე დაძაბული წერტილი; კვანძის გახსნა კი — კონფლიქტის გადაწყვეტა და ფინალური შედეგი.'
  },
  {
    id: 'fc-3',
    tag: 'სტილისტიკა',
    front: 'რა განსხვავებაა ტავტოლოგიასა და პლეონაზმს შორის?',
    back: 'ტავტოლოგია არის ერთი და იმავე ან მსგავსი მნიშვნელობის სიტყვების უსარგებლო გამეორება („მაგალითის მაგალითი“), ხოლო პლეონაზმი — აზრობრივად ზედმეტი მსაზღვრელის დამატება („უკან დაბრუნდა“, „პირველი დებიუტი“).'
  },
  {
    id: 'fc-4',
    tag: 'ანალიზი',
    front: 'როგორ ვადგენთ ტექსტის მთავარ სათქმელს (იდეას)?',
    back: 'ვაკვირდებით სათაურს, მთავარი პერსონაჟის სახე-სიმბოლოს, კონფლიქტის გადაწყვეტას და ფინალურ აბზაცს/სტროფს, სადაც ავტორის პოზიცია ყველაზე მკაფიოდ ჩანს.'
  }
];

const PODCAST_CHAPTERS = [
  { time: '00:00', title: 'შესავალი: რა შედის ორშაბათის ქართულის ქვიზში', duration: '1:15' },
  { time: '01:15', title: 'ტექსტის მთავარი პრობლემატიკა და სიმბოლოები', duration: '2:30' },
  { time: '03:45', title: 'მხატვრული ხერხების სწრაფი გარჩევა (მეტაფორა, ეპითეტი, ალეგორია)', duration: '2:10' },
  { time: '05:55', title: 'როგორ დავწეროთ ღია კითხვები უმაღლეს ქულაზე', duration: '1:50' }
];

export const QuizPrepSection: React.FC = () => {
  const [activeStudioTab, setActiveStudioTab] = useState<StudioTab>('overview');
  const [notebookUrl, setNotebookUrl] = useState<string>(DEFAULT_NOTEBOOKLM_URL);
  const [customMaterialText, setCustomMaterialText] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Podcast Audio Overview State (Web Speech / Simulated Audio Player)
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);
  const [podcastProgress, setPodcastProgress] = useState(18);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);

  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});

  // Flashcards State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});

  // AI Grounded Q&A Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: 'გამარჯობა! ეს არის ორშაბათის ქართულის ქვიზის AI ასისტენტი (NotebookLM სტილის კვლევის რეჟიმი). შეგიძლია მკითხო ტექსტის ანალიზზე, მხატვრულ ხერხებზე, ციტატებზე ან ჩააკოპირო მასალა სწრაფი დამუშავებისთვის.',
      citations: ['ქართულის კათედრა • თ. თვალჭრელიძე', 'ორშაბათი • მე-6 გაკვეთილი']
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPlayingPodcast) return;
    const interval = setInterval(() => {
      setPodcastProgress(prev => {
        if (prev >= 100) {
          setIsPlayingPodcast(false);
          return 0;
        }
        return Math.min(100, prev + 0.5 * playbackSpeed);
      });
    }, 300);
    return () => clearInterval(interval);
  }, [isPlayingPodcast, playbackSpeed]);

  const handleSelectAnswer = (qId: string, optionIdx: number) => {
    soundEffects.click();
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    setShowExplanations(prev => ({ ...prev, [qId]: true }));
  };

  const handleResetQuiz = () => {
    soundEffects.click();
    setSelectedAnswers({});
    setShowExplanations({});
  };

  const correctCount = INITIAL_QUIZ_QUESTIONS.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  const handleSendChat = (promptText?: string) => {
    const query = (promptText ?? chatInput).trim();
    if (!query) return;
    soundEffects.click();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query
    };

    const lower = query.toLowerCase();
    let reply =
      'ორშაბათის ქართულის ქვიზისთვის ყურადღება გაამახვილე სამ მთავარ კომპონენტზე: 1) ტექსტის მთავარი იდეა და პერსონაჟთა ხასიათი, 2) მხატვრულ-გამომსახველობითი ხერხები (მეტაფორა, ეპითეტი, შედარება, გაპიროვნება), 3) არგუმენტირებული მსჯელობა ტექსტური ციტატის დამოწმებით.';
    let citations = ['კონსპექტი §1', 'შეფასების რუბრიკა'];

    if (lower.includes('მხატვრულ') || lower.includes('ტროპ') || lower.includes('მეტაფორ')) {
      reply =
        'ქვიზში მხატვრული ხერხების ამოცნობისას: \n• თუ საგნები შედარებულია კავშირით („როგორც“, „-ვით“, „თითქოს“) — ეს არის შედარება.\n• თუ კავშირი გამოტოვებულია და თვისება პირდაპირ გადატანილია — მეტაფორა.\n• თუ უსულო საგანი მოქმედებს როგორც ადამიანი — გაპიროვნება.\n• თუ მხატვრული განსაზღვრება ახასიათებს საგანს — ეპითეტი.';
      citations = ['ლიტერატურის თეორია • ტროპები', 'ქვიზის საკითხი #1-2'];
    } else if (lower.includes('ღია') || lower.includes('ქულა') || lower.includes('როგორ დავწერო')) {
      reply =
        'ღია კითხვაში მაქსიმალური ქულის ასაღებად გამოიყენე 3-ნაბიჯიანი ფორმულა:\n1. პირდაპირი პასუხი (1 წინადადებით ჩამოაყალიბე მთავარი აზრი).\n2. ტექსტური დასაბუთება (მოიყვანე მოკლე ციტატა ან კონკრეტული ეპიზოდი).\n3. დასკვნა (ახსენი, რატომ გამოიყენა ავტორმა ეს დეტალი და რას ემსახურება იგი).';
      citations = ['თ. თვალჭრელიძე • ღია კითხვების სტრუქტურა'];
    } else if (lower.includes('notebooklm') || lower.includes('პოდკასტ')) {
      reply =
        'ზედა წითელ ბანერში შეგიძლია დააჭირო „გახსენი Google NotebookLM“-ს. თუ მასალას ჩააგდებ NotebookLM-ში, ის ავტომატურად დააგენერირებს Audio Overview-ს (პოდკასტს), Flashcard-ებს და Study Guide-ს ზუსტად შენს ატვირთულ ტექსტზე დაყრდნობით!';
      citations = ['NotebookLM Studio Guide'];
    }

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      role: 'assistant',
      text: reply,
      citations
    };

    setChatMessages(prev => [...prev, userMsg, aiMsg]);
    if (!promptText) setChatInput('');
  };

  const handleCopyNotebookPrompt = () => {
    const promptToCopy =
      customMaterialText.trim() ||
      'გთხოვთ, გააანალიზოთ ეს ქართულის მასალა მე-11 კლასის ორშაბათის ქვიზისთვის: შეადგინეთ მოკლე კონსპექტი, ამოიწერეთ საკვანძო ციტატები და მხატვრული ხერხები, და დამიგენერირეთ 10 სავარჯიშო კითხვა სწორი პასუხებით.';
    navigator.clipboard?.writeText(promptToCopy);
    setCopiedPrompt(true);
    soundEffects.success();
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  const currentFlashcard = INITIAL_FLASHCARDS[currentCardIndex];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6"
    >
      {/* Top Urgent Monday Quiz Red Alert Header */}
      <div className="relative overflow-hidden rounded-3xl border border-red-500/45 bg-gradient-to-br from-red-950/65 via-[#18131d]/95 to-[#12131d]/95 p-5 sm:p-7 shadow-[0_0_45px_rgba(239,68,68,0.18)] backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-[0_0_18px_rgba(239,68,68,0.65)] animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>ორშაბათი &bull; 26 ოქტომბერი</span>
              </span>
              <span className="px-2.5 py-1 rounded-full border border-red-400/30 bg-red-500/15 text-red-200 text-xs font-mono">
                მე-6 გაკვეთილი (13:05 - 13:50)
              </span>
              <span className="px-2.5 py-1 rounded-full border border-[#f5f2eb]/15 bg-white/5 text-[#dedacb] text-xs font-mono">
                მასწ: თ. თვალჭრელიძე
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#fcfbf7]">
              ქართულის ქვიზი — მოსამზადებელი სტუდია
            </h1>

            <p className="text-xs sm:text-sm text-[#d4d1c5] leading-relaxed">
              ყველა საჭირო ხელსაწყო ერთ გვერდზე: <strong className="text-[#fcfbf7]">NotebookLM-ის პირდაპირი ჰაბი</strong>, აუდიო პოდკასტი (Audio Overview), ვიდეო და სტრუქტურირებული კონსპექტი, ინტერაქტიული ტესტი, ფლეშ-ბარათები და AI კითხვა-პასუხი.
            </p>
          </div>

          {/* Direct NotebookLM Launchpad Card */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-red-400/35 bg-[#141522]/90 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-[#fcfbf7]">Google NotebookLM</div>
                  <div className="text-[10px] font-mono text-red-300">AI პოდკასტი, ტესტები &amp; ჩატი</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                LIVE HUB
              </span>
            </div>

            <p className="text-[11px] text-[#c5c1b2] leading-relaxed">
              გახსენი NotebookLM-ის საზიარო ნოუთბუქი, სადაც დაგენერირებულია აუდიო გარჩევა, ვიდეო მიმოხილვა, ქვიზები და კითხვების დასმა:
            </p>

            <div className="flex flex-col gap-2">
              <a
                href={notebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEffects.click()}
                className="w-full py-2.5 px-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/25 cursor-pointer"
              >
                <span>გახსენი NotebookLM-ში</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleCopyNotebookPrompt}
                className="w-full py-1.5 px-3 rounded-lg border border-[#f5f2eb]/15 bg-white/5 hover:bg-white/10 text-[#dedacb] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">პრომპტი დაკოპირდა!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>დააკოპირე ქვიზის AI პრომპტი</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Material Drop / Ready Banner for User's Incoming Material */}
      <div className="rounded-2xl border border-[#f5f2eb]/15 bg-[#161724]/85 p-4 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-300 shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-[#fcfbf7]">
                ქვიზის მასალის სწრაფი ჩასმა &amp; NotebookLM-ის ლინკი
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                ორშაბათი
              </span>
            </div>
            <p className="text-xs text-[#b8b5a8] mt-0.5">
              ჩააგდე აქ ზუსტი ტექსტი/საკითხები ან ჩასვი შენი დაგენერირებული NotebookLM-ის საზიარო ლინკი („Anyone with a link“).
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <input
            type="url"
            value={notebookUrl === DEFAULT_NOTEBOOKLM_URL ? '' : notebookUrl}
            onChange={e => setNotebookUrl(e.target.value.trim() || DEFAULT_NOTEBOOKLM_URL)}
            placeholder="ჩასვი NotebookLM-ის ლინკი..."
            className="w-full sm:w-64 px-3 py-2 rounded-xl bg-[#12131d] border border-[#f5f2eb]/15 text-xs text-[#fcfbf7] placeholder:text-[#7c796e] focus:outline-none focus:border-red-400"
          />
        </div>
      </div>

      {/* Studio Navigation Pills (NotebookLM-style Study Modules) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview' as StudioTab, label: 'ვიდეო & კონსპექტი', icon: Video, badge: 'Study Guide' },
          { id: 'podcast' as StudioTab, label: 'აუდიო პოდკასტი', icon: Headphones, badge: 'Audio Overview' },
          { id: 'quiz' as StudioTab, label: 'ინტერაქტიული ქვიზი', icon: HelpCircle, badge: `${INITIAL_QUIZ_QUESTIONS.length} კითხვა` },
          { id: 'flashcards' as StudioTab, label: 'ფლეშ-ბარათები', icon: Layers, badge: `${INITIAL_FLASHCARDS.length} ბარათი` },
          { id: 'chat' as StudioTab, label: 'კითხვების დასმა (AI)', icon: MessageSquare, badge: 'Q&A' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeStudioTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEffects.click();
                setActiveStudioTab(tab.id);
              }}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                  : 'bg-[#171825]/80 text-[#c7c4b5] border-[#f5f2eb]/10 hover:text-[#fcfbf7] hover:bg-[#1f2133]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-black/25 text-white' : 'bg-white/5 text-[#a8a495]'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* STUDIO MODULE 1: VIDEO OVERVIEW & STRUCTURED STUDY GUIDE */}
      {activeStudioTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Columns: Structured Study Guide & Material Notes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-[#141522]/85 border border-[#f5f2eb]/12 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-300">
                    NOTEBOOKLM STUDY GUIDE &bull; ორშაბათი
                  </span>
                  <h3 className="text-lg font-bold text-[#fcfbf7]">
                    ქართულის ქვიზის სტრუქტურირებული კონსპექტი
                  </h3>
                </div>
                <FileText className="w-5 h-5 text-red-400" />
              </div>

              <div className="space-y-3">
                {INITIAL_STUDY_NOTES.map(section => (
                  <div
                    key={section.id}
                    className="p-4 rounded-xl bg-[#181928]/80 border border-[#f5f2eb]/10 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#fcfbf7]">{section.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 shrink-0">
                        {section.badge}
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#d4d1c5]">
                      {section.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-red-400 font-bold mt-0.5">&bull;</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Custom Material Paste Box */}
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-semibold text-[#dedacb]">
                  ჩაამატე მასწავლებლის ჩამონათვალი ან ტექსტის ნაწყვეტი (სწრაფი შენახვა ბრაუზერში):
                </label>
                <textarea
                  rows={3}
                  value={customMaterialText}
                  onChange={e => setCustomMaterialText(e.target.value)}
                  placeholder="მაგ: ორშაბათის ქვიზში შედის: 1) ნაწარმოების ანალიზი... 2) საზეპირო ციტატები..."
                  className="w-full p-3 rounded-xl bg-[#12131d] border border-[#f5f2eb]/15 text-xs text-[#fcfbf7] placeholder:text-[#7c796e] focus:outline-none focus:border-red-400"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Video Overview & NotebookLM Features */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#141522]/85 border border-[#f5f2eb]/12 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-300">
                    VIDEO OVERVIEW
                  </span>
                  <h3 className="text-base font-bold text-[#fcfbf7]">
                    ვიდეო მიმოხილვა &amp; სლაიდები
                  </h3>
                </div>
                <Video className="w-4 h-4 text-red-400" />
              </div>

              {/* Visual Video Overview Card */}
              <div className="relative rounded-xl overflow-hidden border border-[#f5f2eb]/15 bg-gradient-to-br from-[#1f1624] via-[#151624] to-[#0f101a] aspect-video flex flex-col items-center justify-center p-4 text-center group">
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-300 mb-2.5 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <div className="text-xs font-bold text-[#fcfbf7]">
                  NotebookLM Video Overview
                </div>
                <p className="text-[11px] text-[#a8a495] mt-1 max-w-xs">
                  ვიდეო-კონსპექტი და ვიზუალური სლაიდები მასალის ჩაგდებისთანავე აქ და NotebookLM-ში აისახება.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-[#dedacb]">
                  როგორ გამოვიყენოთ მაქსიმალურად ეფექტურად:
                </div>
                <div className="space-y-2 text-[11px] text-[#b8b5a8]">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-[#f5f2eb]/10 flex items-center justify-between">
                    <span>1. მოუსმინე 6-წუთიან AI პოდკასტს</span>
                    <button
                      onClick={() => setActiveStudioTab('podcast')}
                      className="text-red-300 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>მოსმენა</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-[#f5f2eb]/10 flex items-center justify-between">
                    <span>2. გაიარე ინტერაქტიული ტესტი</span>
                    <button
                      onClick={() => setActiveStudioTab('quiz')}
                      className="text-red-300 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>დაწყება</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-[#f5f2eb]/10 flex items-center justify-between">
                    <span>3. გადაიმეორე ფლეშ-ბარათებით</span>
                    <button
                      onClick={() => setActiveStudioTab('flashcards')}
                      className="text-red-300 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>ბარათები</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDIO MODULE 2: AI AUDIO PODCAST OVERVIEW */}
      {activeStudioTab === 'podcast' && (
        <div className="p-6 rounded-3xl bg-[#141522]/90 border border-[#f5f2eb]/15 backdrop-blur-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-red-300">
                <Volume2 className="w-4 h-4" />
                <span>NOTEBOOKLM AUDIO OVERVIEW &bull; DEEP DIVE PODCAST</span>
              </div>
              <h3 className="text-xl font-bold text-[#fcfbf7]">
                პოდკასტის სტილის აუდიო გარჩევა (2 წამყვანის დიალოგი)
              </h3>
              <p className="text-xs text-[#b8b5a8]">
                მოუსმინე საკითხების ცოცხალ გარჩევას გზაში ან გამეორებისას — ზუსტად NotebookLM-ის Deep Dive ფორმატში.
              </p>
            </div>

            {/* Playback Speed Controls */}
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              {([1, 1.25, 1.5] as const).map(spd => (
                <button
                  key={spd}
                  onClick={() => {
                    soundEffects.click();
                    setPlaybackSpeed(spd);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 text-[#b8b5a8] hover:text-white border border-[#f5f2eb]/10'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Audio Player Visualizer Bar */}
          <div className="p-5 rounded-2xl bg-[#181928] border border-red-500/25 space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  soundEffects.click();
                  setIsPlayingPodcast(!isPlayingPodcast);
                }}
                className="w-12 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all cursor-pointer shrink-0"
              >
                {isPlayingPodcast ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#fcfbf7]">
                    {PODCAST_CHAPTERS[activeChapterIdx]?.title}
                  </span>
                  <span className="font-mono text-[#a8a495]">
                    {Math.floor((podcastProgress / 100) * 7)}:
                    {String(Math.floor(((podcastProgress / 100) * 465) % 60)).padStart(2, '0')} / 07:45
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                    setPodcastProgress(pct);
                  }}
                  className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden cursor-pointer"
                >
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${podcastProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Chapters List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {PODCAST_CHAPTERS.map((chap, idx) => {
                const isCurrent = activeChapterIdx === idx;
                return (
                  <button
                    key={chap.time}
                    onClick={() => {
                      soundEffects.click();
                      setActiveChapterIdx(idx);
                      setPodcastProgress(idx * 25 + 5);
                      setIsPlayingPodcast(true);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-red-500/15 border-red-500/40 text-[#fcfbf7]'
                        : 'bg-white/5 border-[#f5f2eb]/10 text-[#c5c1b2] hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/30 text-red-300 shrink-0">
                        {chap.time}
                      </span>
                      <span className="text-xs font-medium truncate">{chap.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#a8a495] shrink-0">{chap.duration}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STUDIO MODULE 3: INTERACTIVE SELF-CHECK QUIZ */}
      {activeStudioTab === 'quiz' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#141522]/85 border border-[#f5f2eb]/12 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-300">
                ACTIVE RECALL &bull; ტესტირება
              </span>
              <h3 className="text-lg font-bold text-[#fcfbf7]">
                ინტერაქტიული მოსამზადებელი ქვიზი
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-mono text-red-200">
                შედეგი: <strong>{correctCount}</strong> / {INITIAL_QUIZ_QUESTIONS.length}
              </div>
              <button
                onClick={handleResetQuiz}
                className="px-3 py-1.5 rounded-xl border border-[#f5f2eb]/15 bg-white/5 hover:bg-white/10 text-xs text-[#dedacb] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>თავიდან</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {INITIAL_QUIZ_QUESTIONS.map((q, qIndex) => {
              const userChoice = selectedAnswers[q.id];
              const isAnswered = userChoice !== undefined;

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-[#141522]/85 border border-[#f5f2eb]/12 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-[#f5f2eb]/10 text-[#c5c1b2]">
                      კითხვა #{qIndex + 1} &bull; {q.category}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-[#fcfbf7] leading-snug">
                    {q.question}
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userChoice === optIdx;
                      const isCorrectOption = q.correctIndex === optIdx;

                      let btnStyle =
                        'bg-[#181928] border-[#f5f2eb]/12 text-[#dedacb] hover:border-[#f5f2eb]/30';
                      if (isAnswered) {
                        if (isCorrectOption) {
                          btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200';
                        } else if (isSelected && !isCorrectOption) {
                          btnStyle = 'bg-red-500/20 border-red-500/50 text-red-200';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(q.id, optIdx)}
                          className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrectOption && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          {isAnswered && isSelected && !isCorrectOption && (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {showExplanations[q.id] && (
                    <div className="p-3.5 rounded-xl bg-white/5 border border-[#f5f2eb]/10 text-xs text-[#d4d1c5] leading-relaxed">
                      <strong className="text-[#fcfbf7]">განმარტება: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDIO MODULE 4: ACTIVE RECALL FLASHCARDS */}
      {activeStudioTab === 'flashcards' && currentFlashcard && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#b8b5a8]">
            <span>
              ბარათი {currentCardIndex + 1} / {INITIAL_FLASHCARDS.length}
            </span>
            <span>
              დამახსოვრებულია: {Object.values(masteredCards).filter(Boolean).length} /{' '}
              {INITIAL_FLASHCARDS.length}
            </span>
          </div>

          <div
            onClick={() => {
              soundEffects.click();
              setIsCardFlipped(!isCardFlipped);
            }}
            className="min-h-[250px] p-7 rounded-3xl bg-gradient-to-br from-[#181928] to-[#12131d] border border-[#f5f2eb]/20 shadow-2xl flex flex-col justify-between cursor-pointer select-none transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-mono">
                {currentFlashcard.tag}
              </span>
              <span className="text-[11px] font-mono text-[#a8a495]">
                {isCardFlipped ? 'პასუხი (დააჭირე გადასაბრუნებლად)' : 'კითხვა (დააჭირე პასუხის სანახავად)'}
              </span>
            </div>

            <div className="my-6 text-center">
              <p className="text-base sm:text-xl font-bold text-[#fcfbf7] leading-relaxed">
                {isCardFlipped ? currentFlashcard.back : currentFlashcard.front}
              </p>
            </div>

            <div className="flex items-center justify-center">
              <span className="text-[11px] font-mono text-red-300/80">
                დააჭირე ბარათს გადასაბრუნებლად ↻
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                soundEffects.click();
                setIsCardFlipped(false);
                setCurrentCardIndex(prev =>
                  prev === 0 ? INITIAL_FLASHCARDS.length - 1 : prev - 1
                );
              }}
              className="px-4 py-2.5 rounded-xl border border-[#f5f2eb]/15 bg-[#161724] text-xs font-semibold text-[#dedacb] cursor-pointer"
            >
              &larr; წინა ბარათი
            </button>

            <button
              onClick={() => {
                soundEffects.success();
                setMasteredCards(prev => ({
                  ...prev,
                  [currentFlashcard.id]: !prev[currentFlashcard.id]
                }));
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                masteredCards[currentFlashcard.id]
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-white/5 border-[#f5f2eb]/15 text-[#dedacb]'
              }`}
            >
              {masteredCards[currentFlashcard.id] ? 'ვიცი ეს საკითხი ✓' : 'მონიშნე როგორც ნასწავლი'}
            </button>

            <button
              onClick={() => {
                soundEffects.click();
                setIsCardFlipped(false);
                setCurrentCardIndex(prev => (prev + 1) % INITIAL_FLASHCARDS.length);
              }}
              className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold cursor-pointer"
            >
              შემდეგი ბარათი &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STUDIO MODULE 5: GROUNDED AI Q&A CHAT */}
      {activeStudioTab === 'chat' && (
        <div className="rounded-3xl bg-[#141522]/90 border border-[#f5f2eb]/15 overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-[#f5f2eb]/10 bg-[#181928]/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-[#fcfbf7]">
                  ჰკითხე AI-ს ქართულის ქვიზის მასალაზე
                </h3>
                <p className="text-[11px] text-[#a8a495]">
                  NotebookLM-ის სტილის წყაროებზე დაყრდნობილი კითხვა-პასუხი
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'როგორ გავარჩიო მხატვრული ხერხები?',
                'როგორ დავწერო ღია კითხვა მაქსიმალურ ქულაზე?'
              ].map(qPrompt => (
                <button
                  key={qPrompt}
                  onClick={() => handleSendChat(qPrompt)}
                  className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-[#f5f2eb]/10 text-[11px] text-[#dedacb] cursor-pointer"
                >
                  {qPrompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-red-500 text-white font-medium'
                      : 'bg-[#191b29] border border-[#f5f2eb]/12 text-[#fcfbf7]'
                  }`}
                >
                  {msg.text}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/10">
                      {msg.citations.map((cit, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 text-red-300"
                        >
                          წყარო: {cit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-3 border-t border-[#f5f2eb]/10 bg-[#12131d] flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="დაუსვი კითხვა ქართულის ქვიზის საკითხებზე..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#181928] border border-[#f5f2eb]/15 text-xs sm:text-sm text-[#fcfbf7] placeholder:text-[#7c796e] focus:outline-none focus:border-red-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>გაგზავნა</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </motion.section>
  );
};
