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
  ChevronRight,
  Copy,
  Check,
  Clock,
  Image as ImageIcon,
  X
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

const DEFAULT_NOTEBOOKLM_URL = 'https://notebooklm.google.com/';

const SYLLABUS_SECTIONS = [
  {
    id: 'sec-1',
    title: '1. „დაკარგული ედემი“ და საქართველო მსოფლიო ლიტერატურულ რუკაზე',
    badge: 'პროგრამული თემა #1',
    points: [
      '„დაკარგული ედემის“ ბიბლიური და ლიტერატურული სახე-სიმბოლო — სამოთხიდან განდევნა, ოქროს ხანის მონატრება და დაკარგული სამშობლოს/თავისუფლების ძიება.',
      'ქართული მწერლობის ადგილი მსოფლიო ლიტერატურულ რუკაზე: ევროპული რომანტიზმის („მსოფლიო სევდა“ / Weltschmerz) და ქართული ეროვნული ტკივილის (სახელმწიფოებრიობის დაკარგვა 1801 წ.) თანაკვეთა.',
      'როგორ იქცევა „დაკარგული ედემი“ ქართველ რომანტიკოსთა შემოქმედებაში საქართველოს წარსული დიდებისა და თავისუფლების ალეგორიად.'
    ]
  },
  {
    id: 'sec-2',
    title: '2. ალექსანდრე ჭავჭავაძე და მისი შემოქმედება',
    badge: '3 პროგრამული ლექსი',
    points: [
      '„ვისაც გსურთ“: წუთისოფლის წარმავლობა და უმადურობა; ნადიმის, ღვინისა და სიყვარულის თემა როგორც სევდის დროებითი გაქარვების გზა (ანაკრეონტული მოტივი რომანტიკული სევდით).',
      '„ვაჰ, დრონი, დრონი“: წარსული ბედნიერი დროის („ტკბილად სადგურის“) დაკარგვით გამოწვეული მწუხარება; ჟამთასვლის შეუქცევადობა, რეფრენი და სოფლის მუხთლობა.',
      '„გოგჩა“: ტბა გოგჩის (სევანის) დიდებული პეიზაჟი და მის ნაპირებზე ნანგრევებად ქცეული ძველი სომხური ქალაქების კონტრასტი; ბუნების მარადიულობა და ადამიანური დიდების წარმავლობა (ალეგორიული ქვეტექსტი დაცემულ საქართველოზე).'
    ]
  },
  {
    id: 'sec-3',
    title: '3. გრიგოლ ორბელიანი და მისი შემოქმედება',
    badge: '2 პროგრამული ლექსი',
    points: [
      '„საღამო გამოსალმებისა“: სამშობლოდან მიმავალი მგზავრის (ლირიკული გმირის) განცდები; ალაზნის ველის, კავკასიონისა და კახეთის პეიზაჟი; განშორების ტკივილი და მშობლიური მიწის სიყვარული.',
      '„თამარ მეფის სახე ბეთანიის ეკლესიაში“: ბეთანიის ტაძარში თამარის ფრესკის წინაშე მდგომი პოეტის მონოლოგი; საქართველოს ოქროს ხანისა და აწმყოს დაცემული მდგომარეობის მძაფრი დაპირისპირება; ვედრება თამარისადმი ერის სულიერი და ეროვნული აღორძინებისთვის.'
    ]
  },
  {
    id: 'sec-4',
    title: '4. მხატვრული გამოსახვის ფორმები & ჟანრის მახასიათებლები',
    badge: 'ბ) თეორია & ფორმატი',
    points: [
      'ალეგორია: ქარაგმული სახე, სადაც ერთი მოვლენის მიღმა იგულისხმება მეორე (მაგ., „გოგჩაში“ აოხრებული ტაძრებისა და ქალაქების მიღმა იკითხება დაკარგული ქართული სახელმწიფოებრიობა; „დაკარგული ედემი“).',
      'რეფრენი: ლექსში სტრიქონის ან სტროფის გამეორება ემოციური და აზრობრივი მუხტის გასაძლიერებლად (მაგ. ალ. ჭავჭავაძის ლექსებში).',
      'რომანტიზმი (ჟანრის მახასიათებლები): გაორებული სამყარო (უფერული რეალობა vs ამაღლებული იდეალი), ისტორიული წარსულის იდეალიზაცია, მსოფლიო და ეროვნული სევდა, ბუნების გაპიროვნება და ლირიკული გმირის მარტოობა.',
      'ტესტის ფორმატი (120 წთ): 1) ღია კითხვები — ა) მოკლე პასუხი (1–2 წინადადებით) და ბ) სამსჯელო/საანალიზო (ნარატიული თხრობით); 2) ანალიტიკური ესე (დასმული საკითხის კრიტიკული ანალიზი).'
    ]
  }
];

const INITIAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'ალექსანდრე ჭავჭავაძე • „გოგჩა“',
    question: 'რა მთავარი მხატვრულ-ფილოსოფიური კონტრასტია წარმოჩენილი ალექსანდრე ჭავჭავაძის ლექსში „გოგჩა“?',
    options: [
      'ქალაქური და სოფლური ცხოვრების დაპირისპირება',
      'ბუნების მარადიული მშვენიერება (ტბა გოგჩა) და კაცობრიობის მიწიერი დიდების წარმავლობა (ნანგრევებად ქცეული სასახლეები და ტაძრები)',
      'სიყვარულისა და მეგობრობის ჭიდილი',
      'ზამთრისა და გაზაფხულის პეიზაჟების შეპირისპირება'
    ],
    correctIndex: 1,
    explanation: '„გოგჩაში“ პოეტი უპირისპირებს ტბის უცვლელ, კამკამა მშვენიერებას მის ნაპირებზე დანგრეულ უძველეს ქალაქებსა და ტაძრებს, რითაც გამოხატავს როგორც წუთისოფლის წარმავლობას, ისე ალეგორიულ გულისტკივილს საქართველოს დაკარგულ დიდებაზე.'
  },
  {
    id: 'q2',
    category: 'ალექსანდრე ჭავჭავაძე • „ვაჰ, დრონი, დრონი“ & „ვისაც გსურთ“',
    question: 'რა განწყობილება აერთიანებს ალექსანდრე ჭავჭავაძის ლექსებს „ვაჰ, დრონი, დრონი“ და „ვისაც გსურთ“?',
    options: [
      'მომავლის უპირობო ოპტიმიზმი და ბრძოლის ჟინი',
      'წუთისოფლის სამდურავი, დროის შეუქცევადი დინებითა და ბედის უკუღმართობით გამოწვეული რომანტიკული სევდა',
      'სატრფოს მიერ მიტოვებული რაინდის შურისძიება',
      'მხოლოდ ბუნების აღწერა ადამიანური განცდების გარეშე'
    ],
    correctIndex: 1,
    explanation: 'ორივე ლექსში წამყვანია დროის წარმავლობისა და წუთისოფლის სიმუხთლის განცდა. „ვაჰ, დრონი, დრონი“ დასტირის გარდასულ „ტკბილ დროს“, ხოლო „ვისაც გსურთ“ ამხელს სოფლის უმადურობას.'
  },
  {
    id: 'q3',
    category: 'გრიგოლ ორბელიანი • „თამარ მეფის სახე ბეთანიის ეკლესიაში“',
    question: 'რას განასახიერებს თამარ მეფის ფრესკა გრიგოლ ორბელიანის ლექსში „თამარ მეფის სახე ბეთანიის ეკლესიაში“?',
    options: [
      'მხოლოდ შუა საუკუნეების ფერწერის ხელოვნებას',
      'საქართველოს „დაკარგულ ედემს“ — წარსულ ძლიერებას, სულიერ სიმაღლესა და ეროვნული აღდგენის იმედს დაცემული აწმყოს ფონზე',
      'მგზავრის მიერ უცხო ქვეყანაში ნანახ სიზმარს',
      'ბუნების სტიქიურ ძალას'
    ],
    correctIndex: 1,
    explanation: 'ბეთანიის ნახევრად დანგრეულ ტაძარში თამარის სახე პოეტისთვის არის საქართველოს ოქროს ხანის ხატება. პოეტი მწვავედ განიცდის აწმყოს დაცემას და თამარს შესთხოვს, კვლავ გადმოხედოს „დავრდომილ“ ივერიას.'
  },
  {
    id: 'q4',
    category: 'გრიგოლ ორბელიანი • „საღამო გამოსალმებისა“',
    question: 'რა გრძნობით არის გამსჭვალული ლირიკული გმირი ლექსში „საღამო გამოსალმებისა“?',
    options: [
      'სამშობლოს მშვენიერებით აღფრთოვანებითა და მასთან განშორების მწვავე სევდით',
      'უცხო მხარეში სამუდამოდ დარჩენის სურვილით',
      'ლხინისა და ნადიმის სიხარულით',
      'ისტორიული ბრძოლის აღწერით'
    ],
    correctIndex: 0,
    explanation: 'ლექსში მგზავრი ეთხოვება მშობლიურ კახეთს, ალაზნის ველსა და კავკასიონს; საღამოს მწუხრი და ბუნების დიდებულება კიდევ უფრო ამძაფრებს სამშობლოსთან განშორების სევდას.'
  },
  {
    id: 'q5',
    category: 'მხატვრული ფორმები & რომანტიზმი',
    question: 'ჩამოთვლილთაგან რომელია რომანტიზმის, როგორც ლიტერატურული მიმდინარეობის, უმთავრესი მახასიათებელი?',
    options: [
      'ყოველდღიური ყოფის ფოტოგრაფიული სიზუსტით ასახვა და ემოციების უარყოფა',
      'გაორებული სამყარო (მიუღებელი რეალობა და სანუკვარი იდეალი), წარსულის იდეალიზაცია, მსოფლიო/ეროვნული სევდა და მარტოსული გმირი',
      'მკაცრი სახელმწიფოებრივი რაციონალიზმი და გრძნობების დამორჩილება გონებისადმი',
      'მხოლოდ სატირული და იუმორისტული სიუჟეტების გამოყენება'
    ],
    correctIndex: 1,
    explanation: 'რომანტიკოსები გაურბიან მძიმე აწმყოს და თავშესაფარს ეძებენ იდეალურ სამყაროში: დიდებულ ისტორიულ წარსულში („დაკარგული ედემი“), ბუნების წიაღში ან სულიერ სიმაღლეში.'
  },
  {
    id: 'q6',
    category: 'ტესტის ფორმატი • 120 წუთი',
    question: 'რა განსხვავებაა ქვიზის I ნაწილის ა) და ბ) ტიპის ღია შეკითხვებს შორის?',
    options: [
      'ა) ტიპი მოითხოვს მოკლე, კონკრეტულ პასუხს 1-2 წინადადებით, ხოლო ბ) ტიპი არის სამსჯელო/საანალიზო და იწერება ნარატიული თხრობით',
      'ორივე კითხვაზე მხოლოდ ერთი სიტყვით უნდა გაეცეს პასუხი',
      'ა) ტიპი არის ესე, ხოლო ბ) ტიპი — ლექსის საზეპირო',
      'დროის ლიმიტი მხოლოდ 30 წუთია'
    ],
    correctIndex: 0,
    explanation: 'პროგრამის მიხედვით, ღია შეკითხვები იყოფა 2 ტიპად: ა) მოკლე პასუხი (1–2 წინადადებით, ფაქტობრივ/საკვანძო ცოდნაზე) და ბ) სამსჯელო/საანალიზო პასუხი ნარატიული თხრობით, რასაც მოსდევს მე-2 დავალება — ანალიტიკური ესე.'
  }
];

const INITIAL_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    tag: 'თემა #1',
    front: 'რას სიმბოლიზირებს „დაკარგული ედემი“ ქართულ რომანტიზმში?',
    back: 'როგორც ბიბლიურ-უნივერსალურ ჰარმონიასთან განშორებას, ისე საქართველოს დაკარგულ თავისუფლებას, სახელმწიფოებრიობასა და „ოქროს ხანას“, რომელსაც პოეტები აწმყოს უიმედო რეალობას უპირისპირებენ.'
  },
  {
    id: 'fc-2',
    tag: 'ალ. ჭავჭავაძე',
    front: 'რა არის ალექსანდრე ჭავჭავაძის ლექსის „გოგჩა“ მთავარი ალეგორია?',
    back: 'გოგჩის (სევანის) ტბის ნაპირას დანგრეული დიდებული ტაძრებისა და ქალაქების სურათით პოეტი ალეგორიულად მიანიშნებს საქართველოს დაცემულ დიდებასა და ისტორიულ ტრაგედიაზე.'
  },
  {
    id: 'fc-3',
    tag: 'ალ. ჭავჭავაძე',
    front: 'რა მხატვრული ფუნქცია აქვს რეფრენს ლექსებში „ვაჰ, დრონი, დრონი“ და „ვისაც გსურთ“?',
    back: 'რეფრენი (განმეორებადი სტრიქონი/მოტივი) კრავს ლექსის კომპოზიციას და მკითხველს მუდმივად შეახსენებს წუთისოფლის წარმავლობისა და სიმუხთლის მთავარ სათქმელს.'
  },
  {
    id: 'fc-4',
    tag: 'გრ. ორბელიანი',
    front: 'როგორ იცვლება განწყობა ლექსში „თამარ მეფის სახე ბეთანიის ეკლესიაში“?',
    back: 'იწყება ფრესკის წინაშე კრძალვითა და ოქროს ხანის გახსენებით, გადადის აწმყოს უმძიმეს სურათსა და სასოწარკვეთაში („დავრდომილი ივერია“), ხოლო სრულდება მხურვალე ლოცვა-ვედრებით ერის სულიერი აღდგენისთვის.'
  },
  {
    id: 'fc-5',
    tag: 'გრ. ორბელიანი',
    front: 'რა როლს ასრულებს ბუნების სურათი ლექსში „საღამო გამოსალმებისა“?',
    back: 'საღამოს მწუხრი, კავკასიონის მწვერვალები და ალაზნის ველი ეხმიანება მგზავრის შინაგან სევდას — ბუნება გაპიროვნებულია და სამშობლოსთან განშორების ტკივილს აძლიერებს.'
  },
  {
    id: 'fc-6',
    tag: 'ტესტის ფორმატი',
    front: 'როგორ ნაწილდება 120 წუთი და რა 3 კომპონენტისგან შედგება I ქვიზი?',
    back: '1) მოკლე ღია კითხვები (პასუხი 1–2 წინადადებით); 2) სამსჯელო/საანალიზო ღია კითხვები (ნარატიული თხრობით); 3) ანალიტიკური ესე (დასმული საკითხის კრიტიკული ანალიზი).'
  }
];

const PODCAST_CHAPTERS = [
  { time: '00:00', title: '1. „დაკარგული ედემი“ და საქართველო მსოფლიო ლიტერატურულ რუკაზე', duration: '2:05' },
  { time: '02:05', title: '2. ალექსანდრე ჭავჭავაძე: „ვისაც გსურთ“, „ვაჰ, დრონი, დრონი“, „გოგჩა“', duration: '3:15' },
  { time: '05:20', title: '3. გრიგოლ ორბელიანი: „საღამო გამოსალმებისა“ & „თამარ მეფის სახე...“', duration: '3:00' },
  { time: '08:20', title: '4. ალეგორია, რეფრენი, რომანტიზმი & 120-წუთიანი ტესტის სტრატეგია', duration: '2:25' }
];

const NOTEBOOKLM_MASTER_PROMPT = `შენ ხარ მე-11 კლასის ქართული ენისა და ლიტერატურის I ქვიზის მოსამზადებელი ექსპერტი (2026-2027 სასწავლო წელი, დრო: 120 წთ).
გთხოვ, დაამუშაო ქვიზის პროგრამა ზუსტად ამ საკითხების მიხედვით:
ა) ავტორთა და ნაწარმოებთა ჩამონათვალი:
1. „დაკარგული ედემი“ და საქართველო მსოფლიო ლიტერატურულ რუკაზე;
2. ალექსანდრე ჭავჭავაძე და მისი შემოქმედება: „ვისაც გსურთ“, „ვაჰ, დრონი, დრონი“, „გოგჩა“;
3. გრიგოლ ორბელიანი და მისი შემოქმედება: „საღამო გამოსალმებისა“, „თამარ მეფის სახე ბეთანიის ეკლესიაში“.
ბ) მხატვრული გამოსახვის ფორმები: ალეგორია, რეფრენი, რომანტიზმი - ჟანრის მახასიათებლები.
ტესტის ფორმატი:
1. ორი ტიპის ღია შეკითხვები: ა) მოკლე, პასუხი 1-2 წინადადებით; ბ) სამსჯელო / საანალიზო - ნარატიული თხრობით.
2. ანალიტიკური ესე - დასმული საკითხის კრიტიკული ანალიზი.

შემიდგინე:
1) თითოეული ლექსის მოკლე ანალიზი და მთავარი ციტატები;
2) 5 მოკლე ღია კითხვა (1-2 წინადადებიანი პასუხით) და 3 სამსჯელო/საანალიზო კითხვა ნიმუშ-პასუხებით;
3) ანალიტიკური ესეს 2 სავარაუდო თემა და არგუმენტების გეგმა.`;

export const QuizPrepSection: React.FC = () => {
  const [activeStudioTab, setActiveStudioTab] = useState<StudioTab>('overview');
  const [notebookUrl, setNotebookUrl] = useState<string>(DEFAULT_NOTEBOOKLM_URL);
  const [customMaterialText, setCustomMaterialText] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);

  // Podcast Audio Overview State
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);
  const [podcastProgress, setPodcastProgress] = useState(12);
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
      text: 'გამარჯობა! მე ვარ ორშაბათის ქართულის I ქვიზის AI ასისტენტი. პროგრამა სრულად ჩატვირთულია:\n• „დაკარგული ედემი“\n• ალ. ჭავჭავაძე („ვისაც გსურთ“, „ვაჰ, დრონი, დრონი“, „გოგჩა“)\n• გრ. ორბელიანი („საღამო გამოსალმებისა“, „თამარ მეფის სახე ბეთანიის ეკლესიაში“)\n• ალეგორია, რეფრენი, რომანტიზმი და ანალიტიკური ესე.\n\nმკითხე ნებისმიერ ლექსზე ან ღია კითხვებისა და ესეს დაწერის სტრუქტურაზე!',
      citations: ['I ქვიზის ოფიციალური პროგრამა (XI კლასი)', 'დრო: 120 წთ']
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
        return Math.min(100, prev + 0.45 * playbackSpeed);
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
      'I ქვიზის პროგრამა მოიცავს 3 მთავარ ბლოკს: 1) „დაკარგული ედემი“ და საქართველო მსოფლიო ლიტერატურულ რუკაზე; 2) ალექსანდრე ჭავჭავაძის 3 ლექსს („ვისაც გსურთ“, „ვაჰ, დრონი, დრონი“, „გოგჩა“); 3) გრიგოლ ორბელიანის 2 ლექსს („საღამო გამოსალმებისა“, „თამარ მეფის სახე ბეთანიის ეკლესიაში“). თეორიული ცნებებიდან შედის: ალეგორია, რეფრენი და რომანტიზმის მახასიათებლები.';
    let citations = ['I ქვიზის პროგრამა • XI კლასი'];

    if (lower.includes('ჭავჭავაძე') || lower.includes('გოგჩა') || lower.includes('დრონი') || lower.includes('ვისაც')) {
      reply =
        'ალექსანდრე ჭავჭავაძის სამივე საპროგრამო ლექსში წამყვანია რომანტიკული სევდა და წუთისოფლის ცვალებადობა:\n• „გოგჩა“: ტბის მარადიული მშვენიერება უპირისპირდება ნაპირზე დანგრეულ ძველ ქალაქებსა და ტაძრებს (ადამიანური დიდების წარმავლობა და დაცემული სამშობლოს ალეგორია).\n• „ვაჰ, დრონი, დრონი“: რეფრენით გაძლიერებული გოდება წარსულ ბედნიერ დროზე, რომელიც უკან აღარ ბრუნდება.\n• „ვისაც გსურთ“: სოფლის უმადურობის მხილება და ლხინით/სიყვარულით სევდის დროებით გაქარვების ცდა.';
      citations = ['ალექსანდრე ჭავჭავაძე • 3 ლექსი', 'ალეგორია და რეფრენი'];
    } else if (lower.includes('ორბელიანი') || lower.includes('თამარ') || lower.includes('ბეთანი') || lower.includes('საღამო')) {
      reply =
        'გრიგოლ ორბელიანის საპროგრამო ლექსები:\n• „თამარ მეფის სახე ბეთანიის ეკლესიაში“: ბეთანიის ტაძარში თამარის ფრესკის წინ მდგომი პოეტი უპირისპირებს საქართველოს „ოქროს ხანას“ და აწმყოს დაცემულ მდგომარეობას („დავრდომილ ივერიას“) და თამარს სულიერ ხსნას შესთხოვს.\n• „საღამო გამოსალმებისა“: სამშობლოდან მიმავალი მგზავრის ემოციური გამომშვიდობება კახეთთან, ალაზნის ველთან და კავკასიონთან.';
      citations = ['გრიგოლ ორბელიანი • 2 ლექსი', 'რომანტიზმი'];
    } else if (lower.includes('ედემ') || lower.includes('რომანტიზმ') || lower.includes('ალეგორი')) {
      reply =
        '• „დაკარგული ედემი“: რომანტიკოსებისთვის დაკარგული სამოთხე (ედემი) ალეგორიულად უკავშირდება საქართველოს დაკარგულ თავისუფლებასა და წარსულ დიდებას.\n• რომანტიზმის ნიშნები: ორსამყაროიანობა (მძიმე აწმყო vs იდეალური წარსული), ეროვნული და მსოფლიო სევდა, ბუნების გაპიროვნება.\n• ალეგორია: ქარაგმული თხრობა (მაგ., გოგჩის ნანგრევებში საქართველოს ბედის დანახვა).';
      citations = ['„დაკარგული ედემი“', 'მხატვრული გამოსახვის ფორმები'];
    } else if (lower.includes('ესე') || lower.includes('ფორმატ') || lower.includes('ღია')) {
      reply =
        'ტესტის ფორმატი (120 წუთი):\n1. ა) მოკლე ღია შეკითხვები — უპასუხე ზუსტად 1–2 წინადადებით, ზედმეტი შესავლის გარეშე.\n1. ბ) სამსჯელო/საანალიზო კითხვები — დაწერე ნარატიული თხრობით: ჩამოაყალიბე მთავარი აზრი, მოიყვანე ტექსტიდან არგუმენტი/ციტატა და ახსენი მხატვრული ხერხი (ალეგორია/რეფრენი).\n2. ანალიტიკური ესე — დასმული საკითხის კრიტიკული ანალიზი (შესავალი თეზისით, 2-3 არგუმენტირებული აბზაცი ლიტერატურული და თანამედროვე პარალელებით, დასკვნა).';
      citations = ['ტესტურ დავალებათა ფორმატი • 120 წთ'];
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
    const promptToCopy = customMaterialText.trim() || NOTEBOOKLM_MASTER_PROMPT;
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
                <span>ორშაბათი &bull; I ქვიზი</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-red-400/30 bg-red-500/15 text-red-200 text-xs font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>საგამოცდო დრო: 120 წთ</span>
              </span>
              <span className="px-2.5 py-1 rounded-full border border-[#f5f2eb]/15 bg-white/5 text-[#dedacb] text-xs font-mono">
                XI კლასი &bull; თ. თვალჭრელიძე
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#fcfbf7]">
              ქართული ენისა და ლიტერატურის I ქვიზი
            </h1>

            <p className="text-xs sm:text-sm text-[#d4d1c5] leading-relaxed">
              ოფიციალური პროგრამა: <strong className="text-[#fcfbf7]">„დაკარგული ედემი“</strong>, <strong className="text-[#fcfbf7]">ალექსანდრე ჭავჭავაძე</strong> („ვისაც გსურთ“, „ვაჰ, დრონი, დრონი“, „გოგჩა“), <strong className="text-[#fcfbf7]">გრიგოლ ორბელიანი</strong> („საღამო გამოსალმებისა“, „თამარ მეფის სახე ბეთანიის ეკლესიაში“), <strong className="text-red-300">ალეგორია, რეფრენი, რომანტიზმი</strong> და <strong className="text-[#fcfbf7]">ანალიტიკური ესე</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => {
                  soundEffects.click();
                  setShowSyllabusModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-[#f5f2eb]/20 text-xs font-semibold text-[#fcfbf7] flex items-center gap-2 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-red-300" />
                <span>გახსენი ოფიციალური პროგრამის ფოტო (ცხრილი)</span>
              </button>
            </div>
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
                READY
              </span>
            </div>

            <p className="text-[11px] text-[#c5c1b2] leading-relaxed">
              დააკოპირე ქვემოთ გამზადებული I ქვიზის სრული პროგრამის პრომპტი და პირდაპირ გახსენი NotebookLM-ში აუდიო პოდკასტისა და ტესტების დასაგენერირებლად:
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
                    <span className="text-emerald-300">პროგრამის პრომპტი დაკოპირდა!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>დააკოპირე პროგრამის AI პრომპტი</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Official Program Table Summary Banner */}
      <div className="rounded-2xl border border-[#f5f2eb]/15 bg-[#161724]/90 p-4 sm:p-5 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f5f2eb]/10 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-300">
              ოფიციალური ცხრილი &bull; 2026-2027 სასწავლო წელი
            </span>
            <h2 className="text-sm sm:text-base font-bold text-[#fcfbf7]">
              ქართული ენისა და ლიტერატურის I ქვიზის პროგრამა და ტესტის ფორმატი
            </h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 self-start sm:self-center">
            XI კლასი &bull; 120 წთ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Column 1: Test Content */}
          <div className="p-3.5 rounded-xl bg-[#12131d]/90 border border-[#f5f2eb]/10 space-y-2">
            <div className="font-bold text-red-300 uppercase font-mono text-[11px]">
              1. ტესტის შინაარსი
            </div>
            <p className="text-[#d4d1c5] leading-relaxed">
              &bull; ტესტი შედგება <strong className="underline text-[#fcfbf7]">მხოლოდ პროგრამული ტექსტებისაგან</strong>. შეკითხვები ორიენტირებული იქნება როგორც საკვანძო ინფორმაციების ცოდნაზე, ისე ანალიზისა და სინთეზის უნარებზე.
            </p>
            <p className="text-[#d4d1c5] leading-relaxed">
              &bull; <strong className="text-[#fcfbf7]">2. ანალიტიკური ესე</strong> — დასმული საკითხის კრიტიკული ანალიზი.
            </p>
          </div>

          {/* Column 2: Authors & Literary Forms */}
          <div className="p-3.5 rounded-xl bg-[#12131d]/90 border border-[#f5f2eb]/10 space-y-2">
            <div className="font-bold text-red-300 uppercase font-mono text-[11px]">
              2. ავტორები, ნაწარმოებები &amp; ფორმები
            </div>
            <ul className="space-y-1 text-[#d4d1c5] leading-relaxed">
              <li>
                <strong className="text-[#fcfbf7]">ა) 1. „დაკარგული ედემი“</strong> და საქართველო მსოფლიო ლიტერატურულ რუკაზე
              </li>
              <li>
                <strong className="text-[#fcfbf7]">2. ალექსანდრე ჭავჭავაძე:</strong> „ვისაც გსურთ“, „ვაჰ, დრონი, დრონი“, „გოგჩა“
              </li>
              <li>
                <strong className="text-[#fcfbf7]">3. გრიგოლ ორბელიანი:</strong> „საღამო გამოსალმებისა“, „თამარ მეფის სახე ბეთანიის ეკლესიაში“
              </li>
              <li className="pt-1 border-t border-white/10">
                <strong className="text-red-200">ბ) ფორმები:</strong> ალეგორია, რეფრენი, <strong>რომანტიზმი</strong> — ჟანრის მახასიათებლები
              </li>
            </ul>
          </div>

          {/* Column 3: Format */}
          <div className="p-3.5 rounded-xl bg-[#12131d]/90 border border-[#f5f2eb]/10 space-y-2">
            <div className="font-bold text-red-300 uppercase font-mono text-[11px]">
              3. ტესტურ დავალებათა ფორმატი
            </div>
            <div className="space-y-1.5 text-[#d4d1c5] leading-relaxed">
              <div>
                <strong className="text-[#fcfbf7]">1. ორი ტიპის ღია შეკითხვები:</strong>
                <div className="pl-2 mt-1 space-y-1">
                  <div>ა) მოკლე, პასუხი 1–2 წინადადებით;</div>
                  <div>ბ) სამსჯელო / საანალიზო — ნარატიული თხრობით.</div>
                </div>
              </div>
              <div className="pt-1 border-t border-white/10">
                <strong className="text-[#fcfbf7]">2. ანალიტიკური ესე</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Studio Navigation Pills (NotebookLM-style Study Modules) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview' as StudioTab, label: 'კონსპექტი & ვიდეო', icon: Video, badge: 'Study Guide' },
          { id: 'podcast' as StudioTab, label: 'აუდიო პოდკასტი', icon: Headphones, badge: 'Audio Overview' },
          { id: 'quiz' as StudioTab, label: 'ინტერაქტიული ტესტი', icon: HelpCircle, badge: `${INITIAL_QUIZ_QUESTIONS.length} კითხვა` },
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
          {/* Left 2 Columns: Detailed Study Guide by Syllabus Topic */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-[#141522]/85 border border-[#f5f2eb]/12 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-300">
                    NOTEBOOKLM STUDY GUIDE &bull; სრული გარჩევა
                  </span>
                  <h3 className="text-lg font-bold text-[#fcfbf7]">
                    საპროგრამო ტექსტებისა და თეორიის კონსპექტი
                  </h3>
                </div>
                <FileText className="w-5 h-5 text-red-400" />
              </div>

              <div className="space-y-3">
                {SYLLABUS_SECTIONS.map(section => (
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
            </div>
          </div>

          {/* Right Column: Official Syllabus Photo & Quick Links */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#141522]/85 border border-[#f5f2eb]/12 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-300">
                    ოფიციალური ფაილი
                  </span>
                  <h3 className="text-base font-bold text-[#fcfbf7]">
                    პროგრამის ფოტო &amp; სტუდია
                  </h3>
                </div>
                <BookOpen className="w-4 h-4 text-red-400" />
              </div>

              {/* Embedded Official Syllabus Image Preview */}
              <div
                onClick={() => {
                  soundEffects.click();
                  setShowSyllabusModal(true);
                }}
                className="relative rounded-xl overflow-hidden border border-[#f5f2eb]/20 bg-white cursor-pointer group"
              >
                <img
                  src="/quiz/georgian-quiz-syllabus.jpg"
                  alt="ქართული ენისა და ლიტერატურის I ქვიზის პროგრამა"
                  className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform"
                />
                <div className="p-2 bg-[#12131d]/90 text-center text-[11px] font-medium text-[#fcfbf7]">
                  დააჭირე გასადიდებლად 🔍
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-[#dedacb]">
                  სწრაფი გადასვლა სტუდიის მოდულებზე:
                </div>
                <div className="space-y-2 text-[11px] text-[#b8b5a8]">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-[#f5f2eb]/10 flex items-center justify-between">
                    <span>1. მოუსმინე AI პოდკასტს (4 თავი)</span>
                    <button
                      onClick={() => setActiveStudioTab('podcast')}
                      className="text-red-300 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>მოსმენა</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-[#f5f2eb]/10 flex items-center justify-between">
                    <span>2. გაიარე 6-კითხვიანი ტესტი</span>
                    <button
                      onClick={() => setActiveStudioTab('quiz')}
                      className="text-red-300 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>დაწყება</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-[#f5f2eb]/10 flex items-center justify-between">
                    <span>3. გადაიმეორე 6 ფლეშ-ბარათით</span>
                    <button
                      onClick={() => setActiveStudioTab('flashcards')}
                      className="text-red-300 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>ბარათები</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-[#f5f2eb]/10 flex items-center justify-between">
                    <span>4. ჰკითხე AI-ს ლექსებსა და ესეზე</span>
                    <button
                      onClick={() => setActiveStudioTab('chat')}
                      className="text-red-300 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>ჩატი</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional NotebookLM Shared Link Input */}
              <div className="pt-2 border-t border-[#f5f2eb]/10 space-y-1.5">
                <label className="block text-[11px] font-mono text-[#a8a495]">
                  NotebookLM-ის საზიარო ლინკი:
                </label>
                <input
                  type="url"
                  value={notebookUrl === DEFAULT_NOTEBOOKLM_URL ? '' : notebookUrl}
                  onChange={e => setNotebookUrl(e.target.value.trim() || DEFAULT_NOTEBOOKLM_URL)}
                  placeholder="ჩასვი NotebookLM share link..."
                  className="w-full px-3 py-2 rounded-xl bg-[#12131d] border border-[#f5f2eb]/15 text-xs text-[#fcfbf7] placeholder:text-[#7c796e] focus:outline-none focus:border-red-400"
                />
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
                <span>NOTEBOOKLM AUDIO OVERVIEW &bull; ქართული რომანტიზმი</span>
              </div>
              <h3 className="text-xl font-bold text-[#fcfbf7]">
                აუდიო მიმოხილვა: „დაკარგული ედემი“, ჭავჭავაძე &amp; ორბელიანი
              </h3>
              <p className="text-xs text-[#b8b5a8]">
                ოთხივე საპროგრამო ბლოკის აუდიო გარჩევა თავების მიხედვით.
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
                    {Math.floor((podcastProgress / 100) * 10)}:
                    {String(Math.floor(((podcastProgress / 100) * 645) % 60)).padStart(2, '0')} / 10:45
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
                ACTIVE RECALL &bull; პროგრამული ტექსტები
              </span>
              <h3 className="text-lg font-bold text-[#fcfbf7]">
                ინტერაქტიული ტესტი (ჭავჭავაძე, ორბელიანი, რომანტიზმი)
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
          <div className="p-4 border-b border-[#f5f2eb]/10 bg-[#181928]/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-[#fcfbf7]">
                  ჰკითხე AI-ს I ქვიზის პროგრამაზე
                </h3>
                <p className="text-[11px] text-[#a8a495]">
                  „დაკარგული ედემი“, ალ. ჭავჭავაძე, გრ. ორბელიანი, რომანტიზმი, ესე
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'გამირჩიე ალ. ჭავჭავაძის 3 ლექსი',
                'გრიგოლ ორბელიანის ლექსების მთავარი სათქმელი',
                'როგორ დავწერო ღია კითხვები და ესე?'
              ].map(qPrompt => (
                <button
                  key={qPrompt}
                  onClick={() => handleSendChat(qPrompt)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-[#f5f2eb]/10 text-[11px] text-[#dedacb] cursor-pointer"
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
              placeholder="იკითხე „გოგჩაზე“, „თამარ მეფის სახეზე“, ალეგორიაზე ან ესეზე..."
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

      {/* Fullscreen Modal for Official Syllabus Image */}
      <AnimatePresence>
        {showSyllabusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSyllabusModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="relative z-10 max-w-5xl w-full rounded-2xl bg-[#141522] border border-[#f5f2eb]/20 overflow-hidden shadow-2xl will-change-transform"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f2eb]/10 bg-[#181928]">
                <span className="text-xs sm:text-sm font-bold text-[#fcfbf7]">
                  ქართული ენისა და ლიტერატურის I ქვიზის პროგრამა და ტესტის ფორმატი (120 წთ)
                </span>
                <button
                  onClick={() => setShowSyllabusModal(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#fcfbf7] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 sm:p-6 bg-white flex items-center justify-center">
                <img
                  src="/quiz/georgian-quiz-syllabus.jpg"
                  alt="ქართული ენისა და ლიტერატურის I ქვიზის პროგრამა"
                  className="w-full h-auto max-h-[78vh] object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
