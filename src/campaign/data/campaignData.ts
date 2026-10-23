export type MainCategory =
  | 'სკოლა'
  | 'აქტივობები'
  | 'ოლიმპიადები'
  | 'შეჯიბრებები';

export type CalendarCategory =
  | 'შემაჯამებელი'
  | 'დამოუკიდებელი'
  | 'გამოკითხვა'
  | 'დავალებები'
  | 'სკოლა'
  | 'აქტივობები'
  | 'მოხალისეობრივი'
  | 'პრე-აქსელერაციის პროგრამები'
  | 'ჩემპიონატები'
  | 'ჰაკათონები/იდეათონები'
  | 'ოლიმპიადები';

export interface CalendarEvent {
  id: string;
  title: string;
  mainCategory: MainCategory;
  category: CalendarCategory; // Filter
  date: string; // YYYY-MM-DD (Start Date)
  endDate?: string; // YYYY-MM-DD (Optional End Date for interval events)
  time?: string;
  teacher?: string;
  location?: string;
  organizer?: string;
  description: string;
  deadline?: string;
  importance: 'მაღალი' | 'საშუალო' | 'სარეკომენდაციო';
  aiAnalysis: {
    difficultyScore: string;
    estimatedHours: string;
    keyPoints: string[];
    strategy: string;
    recommendation: string;
  };
}

export const MAIN_CATEGORIES: {
  id: MainCategory;
  label: string;
  description: string;
}[] = [
  {
    id: 'სკოლა',
    label: 'სკოლა',
    description: 'შემაჯამებლები, დამოუკიდებლები, გამოკითხვები და დავალებები'
  },
  {
    id: 'აქტივობები',
    label: 'აქტივობები',
    description: 'კლუბები, მოხალისეობა და პრე-აქსელერაციის პროგრამები'
  },
  {
    id: 'ოლიმპიადები',
    label: 'ოლიმპიადები',
    description: 'სასკოლო და ეროვნული სასწავლო ოლიმპიადები'
  },
  {
    id: 'შეჯიბრებები',
    label: 'შეჯიბრებები',
    description: 'სასკოლო ჩემპიონატები, ტურნირები და ჰაკათონები'
  }
];

export const CALENDAR_FILTERS: {
  id: CalendarCategory;
  label: string;
  parentCategory: MainCategory;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}[] = [
  {
    id: 'შემაჯამებელი',
    label: 'შემაჯამებელი',
    parentCategory: 'სკოლა',
    color: '#ef4444', // Red
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-300',
    borderClass: 'border-red-500/40',
    dotClass: 'bg-red-500'
  },
  {
    id: 'დამოუკიდებელი',
    label: 'დამოუკიდებელი',
    parentCategory: 'სკოლა',
    color: '#fb923c', // Orange
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-300',
    borderClass: 'border-orange-500/30',
    dotClass: 'bg-orange-400'
  },
  {
    id: 'გამოკითხვა',
    label: 'გამოკითხვა',
    parentCategory: 'სკოლა',
    color: '#f472b6', // Pink
    bgClass: 'bg-pink-500/15',
    textClass: 'text-pink-300',
    borderClass: 'border-pink-500/30',
    dotClass: 'bg-pink-400'
  },
  {
    id: 'დავალებები',
    label: 'დავალებები',
    parentCategory: 'სკოლა',
    color: '#fbbf24', // Amber
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/30',
    dotClass: 'bg-amber-400'
  },
  {
    id: 'სკოლა',
    label: 'სასკოლო პროცესი',
    parentCategory: 'სკოლა',
    color: '#818cf8', // Indigo
    bgClass: 'bg-indigo-500/15',
    textClass: 'text-indigo-300',
    borderClass: 'border-indigo-500/30',
    dotClass: 'bg-indigo-400'
  },
  {
    id: 'ჩემპიონატები',
    label: 'ჩემპიონატები',
    parentCategory: 'შეჯიბრებები',
    color: '#355440', // Subtle low-saturation dark green
    bgClass: 'bg-[#23382b]/70',
    textClass: 'text-[#8ca695]',
    borderClass: 'border-[#355440]/50',
    dotClass: 'bg-[#466b53]'
  },
  {
    id: 'ჰაკათონები/იდეათონები',
    label: 'ჰაკათონები/იდეათონები',
    parentCategory: 'შეჯიბრებები',
    color: '#34d399', // Emerald
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/30',
    dotClass: 'bg-emerald-400'
  },
  {
    id: 'აქტივობები',
    label: 'აქტივობები',
    parentCategory: 'აქტივობები',
    color: '#c084fc', // Purple
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-500/30',
    dotClass: 'bg-purple-400'
  },
  {
    id: 'პრე-აქსელერაციის პროგრამები',
    label: 'პრე-აქსელერაციის პროგრამები',
    parentCategory: 'აქტივობები',
    color: '#38bdf8', // Sky Cyan
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-500/30',
    dotClass: 'bg-sky-400'
  },
  {
    id: 'მოხალისეობრივი',
    label: 'მოხალისეობრივი',
    parentCategory: 'აქტივობები',
    color: '#facc15', // Yellow
    bgClass: 'bg-yellow-500/15',
    textClass: 'text-yellow-300',
    borderClass: 'border-yellow-500/30',
    dotClass: 'bg-yellow-400'
  },
  {
    id: 'ოლიმპიადები',
    label: 'ოლიმპიადები',
    parentCategory: 'ოლიმპიადები',
    color: '#2dd4bf', // Teal
    bgClass: 'bg-teal-500/15',
    textClass: 'text-teal-300',
    borderClass: 'border-teal-500/30',
    dotClass: 'bg-teal-400'
  }
];

// Keep alias for compatibility if needed
export const CALENDAR_CATEGORIES = CALENDAR_FILTERS;

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  // 0. 26 ოქტომბერი (ორშაბათი) - ქართულის ქვიზი
  {
    id: 'georgian-quiz-oct26',
    title: 'ქართულის ქვიზი (ორშაბათი)',
    mainCategory: 'სკოლა',
    category: 'შემაჯამებელი',
    date: '2026-10-26',
    time: '13:05 - 13:50 (მე-6 გაკვეთილი)',
    teacher: 'თ. თვალჭრელიძე',
    location: 'საკლასო ოთახი',
    organizer: 'ქართულის კათედრა • თ. თვალჭრელიძე',
    description: 'ორშაბათის ქართულის ქვიზი! მოსამზადებელი მასალა, NotebookLM-ის აუდიო პოდკასტი, კონსპექტი, ფლეშ-ბარათები და ინტერაქტიული ტესტები იხილეთ „ქვიზი (ორშაბათი)“ გვერდზე.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8.5 / 10 (საჭიროებს ტექსტის ღრმა ანალიზს)',
      estimatedHours: '2 - 3 საათი (NotebookLM სტუდიით)',
      keyPoints: [
        'ტექსტის მხატვრული ანალიზი, ტროპები (მეტაფორა, ეპითეტი, გაპიროვნება) და მთავარი სათქმელი',
        'საკვანძო ციტატებისა და ეპოქალური კონტექსტის ცოდნა',
        'ღია კითხვებში არგუმენტირებული მსჯელობის აგება'
      ],
      strategy: 'გადადით პლატფორმის „ქვიზი (ორშაბათი)“ გვერდზე, მოუსმინეთ AI პოდკასტს და გაიარეთ თვითშემოწმების ტესტი.',
      recommendation: 'გახსენით NotebookLM-ის ჰაბი და დაუსვით კითხვები AI ასისტენტს კონკრეტულ ეპიზოდებზე.'
    }
  },

  // 1. 20 ოქტომბერი - მათემატიკის შემაჯამებელი (ნანა ჯაფარიძე)
  {
    id: 'math-exam-oct20',
    title: 'მათემატიკის შემაჯამებელი',
    mainCategory: 'სკოლა',
    category: 'შემაჯამებელი',
    date: '2026-10-20',
    time: '10:10 - 12:05',
    teacher: 'ნანა ჯაფარიძე',
    location: 'საკლასო ოთახი',
    organizer: 'მათემატიკის კათედრა • ნანა ჯაფარიძე',
    description: 'მასწი გაბრაზებულია და ძველ მასალასაც მოიტანს და ახალსაც, შეიძლება თვისებები და დამტკიცებებიც მოიტანოს.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '9.5 / 10 (უმაღლესი სირთულე — მასწი გაბრაზებულია)',
      estimatedHours: '6 - 8 საათი მომზადება',
      keyPoints: [
        'ძველი და ახალი მასალის კომბინირებული საკითხები',
        'თეორემების თვისებები და მკაცრი მათემატიკური დამტკიცებები',
        'ალგებრული განტოლებები და რთული გარდაქმნები'
      ],
      strategy: 'აუცილებლად გადაიმეორეთ ყველა თეორემის დამტკიცება და თვისება, რადგან ნანა მასწავლებელი მარტო საბოლოო პასუხს არ ჩათვლის.',
      recommendation: 'დაიწყეთ გამეორება რამდენიმე დღით ადრე და ამოხსენით 54-60 ნომრების მსგავსი განტოლებები.'
    }
  },

  // 2. 15 ოქტომბერი - რუსულის შემაჯამებელი
  {
    id: 'russian-exam-oct15',
    title: 'რუსულის შემაჯამებელი',
    mainCategory: 'სკოლა',
    category: 'შემაჯამებელი',
    date: '2026-10-15',
    time: '10:10 - 10:55',
    teacher: 'იულია',
    location: 'საკლასო ოთახი',
    organizer: 'უცხო ენების კათედრა • იულია',
    description: 'ტექსტი ცხოველებზე. სირთულე 7.5-8.5/10. ზეპირი გადაწერა მოსულა (თუ კარგად ზიხარ).',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '7.5 - 8.5 / 10',
      estimatedHours: '1.5 - 2 საათი',
      keyPoints: [
        'ტექსტი ცხოველებზე — თხრობა და ძირითადი ლექსიკა',
        'ზეპირი გადაწერა მოსულა (თუ კარგად ზიხარ)',
        'კითხვებზე მოკლე პასუხების გაცემა'
      ],
      strategy: 'დაიკავეთ კარგი პოზიცია მერხთან. გადაიკითხეთ ტექსტი ცხოველებზე და მონიშნეთ საკვანძო სიტყვები.',
      recommendation: 'თუ კარგად ზიხარ, გადაწერა მარტივად გამოვა, თუმცა ძირითადი წინადადებები წინასწარ გადაათვალიერეთ.'
    }
  },

  // 3. სამშაბათების მათემატიკის დამოუკიდებლები (6 ოქტ, 13 ოქტ, 27 ოქტ, 3 ნოემ) — 20 ოქტომბრის გარდა!
  {
    id: 'math-ind-oct6',
    title: 'მათემატიკის დამოუკიდებელი',
    mainCategory: 'სკოლა',
    category: 'დამოუკიდებელი',
    date: '2026-10-06',
    time: '10:10 - 10:55',
    teacher: 'ნანა ჯაფარიძე',
    location: 'საკლასო ოთახი',
    organizer: 'ნანა ჯაფარიძე',
    description: 'სამშაბათის ყოველკვირეული მათემატიკის დამოუკიდებელი სამუშაო. მასწავლებელი: ნანა ჯაფარიძე.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8.0 / 10',
      estimatedHours: '2 საათი',
      keyPoints: [
        'მიმდინარე პარაგრაფის ამოცანები',
        'დროის ლიმიტი: 45 წუთი',
        'სრული მსჯელობის დაწერა'
      ],
      strategy: 'გადახედეთ წინა დღის საშინაო დავალების ნომრებს.',
      recommendation: 'ყურადღება მიაქციეთ განტოლების ფესვების შემოწმებას (დ.ს.ა.).'
    }
  },
  {
    id: 'math-ind-oct13',
    title: 'მათემატიკის დამოუკიდებელი',
    mainCategory: 'სკოლა',
    category: 'დამოუკიდებელი',
    date: '2026-10-13',
    time: '10:10 - 10:55',
    teacher: 'ნანა ჯაფარიძე',
    location: 'საკლასო ოთახი',
    organizer: 'ნანა ჯაფარიძე',
    description: 'სამშაბათის ყოველკვირეული მათემატიკის დამოუკიდებელი სამუშაო (ალგებრული განტოლებები). მასწავლებელი: ნანა ჯაფარიძე.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8.2 / 10',
      estimatedHours: '2 - 3 საათი',
      keyPoints: [
        'ალგებრული განტოლებები (54-60 ნომრების თემატიკა)',
        'მასწავლებელი: ნანა ჯაფარიძე',
        'სუფთა და თანმიმდევრული ამოხსნა'
      ],
      strategy: 'საფუძვლიანად გაარჩიეთ დღევანდელი საშინაო დავალება (ალგ. განტოლებები 54-60).',
      recommendation: 'არ გამოტოვოთ შუალედური გარდაქმნები წერისას.'
    }
  },
  {
    id: 'math-ind-oct27',
    title: 'მათემატიკის დამოუკიდებელი',
    mainCategory: 'სკოლა',
    category: 'დამოუკიდებელი',
    date: '2026-10-27',
    time: '10:10 - 10:55',
    teacher: 'ნანა ჯაფარიძე',
    location: 'საკლასო ოთახი',
    organizer: 'ნანა ჯაფარიძე',
    description: 'სამშაბათის ყოველკვირეული მათემატიკის დამოუკიდებელი სამუშაო. მასწავლებელი: ნანა ჯაფარიძე.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8.0 / 10',
      estimatedHours: '2 - 3 საათი',
      keyPoints: [
        'შემაჯამებლის შემდგომი ახალი თემის შემოწმება',
        'მასწავლებელი: ნანა ჯაფარიძე',
        'პრაქტიკული ამოცანების ამოხსნა'
      ],
      strategy: 'გაიმეორეთ კვირის განმავლობაში გავლილი ფორმულები და თვისებები.',
      recommendation: 'იმუშავეთ სისწრაფეზე, რომ ყველა ვარიანტის საკითხი მოასწროთ.'
    }
  },
  {
    id: 'math-ind-nov3',
    title: 'მათემატიკის დამოუკიდებელი',
    mainCategory: 'სკოლა',
    category: 'დამოუკიდებელი',
    date: '2026-11-03',
    time: '10:10 - 10:55',
    teacher: 'ნანა ჯაფარიძე',
    location: 'საკლასო ოთახი',
    organizer: 'ნანა ჯაფარიძე',
    description: 'სამშაბათის ყოველკვირეული მათემატიკის დამოუკიდებელი სამუშაო. მასწავლებელი: ნანა ჯაფარიძე.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8.0 / 10',
      estimatedHours: '2 საათი',
      keyPoints: [
        'კვირის მასალის შეჯამება',
        'მასწავლებელი: ნანა ჯაფარიძე'
      ],
      strategy: 'გადახედეთ ხუთშაბათისა და პარასკევის საკლასო ამოცანებს.',
      recommendation: 'დაწერეთ ყველა ნაბიჯი დეტალურად.'
    }
  },

  // 4. 13 ოქტომბერი - მათემატიკის საშინაო დავალება
  {
    id: 'hw-math-oct13',
    title: 'მათემატიკა: ალგ. განტოლებები 54-60',
    mainCategory: 'სკოლა',
    category: 'დავალებები',
    date: '2026-10-13',
    time: '10:10',
    teacher: 'ნანა ჯაფარიძე',
    location: 'საკლასო ოთახი',
    organizer: 'ნანა ჯაფარიძე',
    description: 'საშინაო დავალება მათემატიკაში: ალგებრული განტოლებები ნომერი 54-დან 60-ის ჩათვლით. მასწავლებელი: ნანა ჯაფარიძე.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '7.5 / 10',
      estimatedHours: '1.5 - 2 საათი',
      keyPoints: [
        'ნომრები: 54, 55, 56, 57, 58, 59, 60',
        'განტოლებების დაყვანა და ფესვების პოვნა',
        'მასწავლებელი: ნანა ჯაფარიძე'
      ],
      strategy: 'დაიწყეთ 54-56 ნომრებით, ხოლო 59-60 ნომრებში ყურადღება მიაქციეთ მნიშვნელის ნულთან არatolობას.',
      recommendation: 'აუცილებლად გქონდეთ რვეულში სრულად დაწერილი სამშაბათის გაკვეთილისთვის.'
    }
  },

  // 5. ბიოლოგია - ყოველ პარასკევს (16 ოქტ, 23 ოქტ, 30 ოქტ, 6 ნოემ)
  {
    id: 'bio-quiz-oct16',
    title: 'ბიოლოგია — ყოველკვირეული გამოკითხვა',
    mainCategory: 'სკოლა',
    category: 'გამოკითხვა',
    date: '2026-10-16',
    time: '10:10 - 10:55 (მე-3 გაკვეთილი)',
    teacher: 'რუსუდან გაფრინდაშვილი',
    location: 'ბიოლოგიის კაბინეტი',
    organizer: 'რუსუდან გაფრინდაშვილი',
    description: 'ყოველკვირეული გამოკითხვა ბიოლოგიაში. მასწავლებელი რუსუდან გაფრინდაშვილი მიუყვება სიას. სირთულე: 8-9/10.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8 - 9 / 10',
      estimatedHours: '2 - 3 საათი',
      keyPoints: [
        'მასწავლებელი: რუსუდან გაფრინდაშვილი',
        'მიუყვება ჟურნალის სიას თანმიმდევრულად',
        'მოითხოვს დეტალურ და ამომწურავ პასუხებს'
      ],
      strategy: 'შეამოწმეთ სიაში სად გაჩერდა წინა გაკვეთილზე და ისწავლეთ როგორც ახალი, ისე წინა პარაგრაფი.',
      recommendation: 'არ დაეყრდნოთ მხოლოდ მოკლე კონსპექტს — რუსუდან მასწავლებელი დეტალებს ეკითხება.'
    }
  },
  {
    id: 'bio-quiz-oct23',
    title: 'ბიოლოგია — ყოველკვირეული გამოკითხვა',
    mainCategory: 'სკოლა',
    category: 'გამოკითხვა',
    date: '2026-10-23',
    time: '10:10 - 10:55 (მე-3 გაკვეთილი)',
    teacher: 'რუსუდან გაფრინდაშვილი',
    location: 'ბიოლოგიის კაბინეტი',
    organizer: 'რუსუდან გაფრინდაშვილი',
    description: 'პარასკევის ყოველკვირეული გამოკითხვა ბიოლოგიაში. მასწავლებელი რუსუდან გაფრინდაშვილი მიუყვება სიას. სირთულე: 8-9/10.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8 - 9 / 10',
      estimatedHours: '2 - 3 საათი',
      keyPoints: [
        'მასწავლებელი: რუსუდან გაფრინდაშვილი',
        'ყოველკვირეული გამოკითხვა სიის მიხედვით',
        'მე-3 გაკვეთილი (10:10 - 10:55)'
      ],
      strategy: 'წინასწარ გაიმეორეთ ტერმინები და ბიოლოგიური პროცესების ეტაპები.',
      recommendation: 'თუ სიაში თქვენი გვარი ახლოსაა, 100%-ით მზად იყავით დაფასთან გამოსასვლელად.'
    }
  },
  {
    id: 'bio-quiz-oct30',
    title: 'ბიოლოგია — ყოველკვირეული გამოკითხვა',
    mainCategory: 'სკოლა',
    category: 'გამოკითხვა',
    date: '2026-10-30',
    time: '10:10 - 10:55 (მე-3 გაკვეთილი)',
    teacher: 'რუსუდან გაფრინდაშვილი',
    location: 'ბიოლოგიის კაბინეტი',
    organizer: 'რუსუდან გაფრინდაშვილი',
    description: 'პარასკევის ყოველკვირეული გამოკითხვა ბიოლოგიაში. მასწავლებელი რუსუდან გაფრინდაშვილი მიუყვება სიას. სირთულე: 8-9/10.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8 - 9 / 10',
      estimatedHours: '2 - 3 საათი',
      keyPoints: [
        'მასწავლებელი: რუსუდან გაფრინდაშვილი',
        'მიუყვება სიას',
        'სირთულე: 8-9/10'
      ],
      strategy: 'ხუთშაბათს საღამოს გადაიმეორეთ მთელი კვირის მასალა.',
      recommendation: 'ყურადღება მიაქციეთ სახელმძღვანელოს სქემებსა და ტაბულებს.'
    }
  },
  {
    id: 'bio-quiz-nov6',
    title: 'ბიოლოგია — ყოველკვირეული გამოკითხვა',
    mainCategory: 'სკოლა',
    category: 'გამოკითხვა',
    date: '2026-11-06',
    time: '10:10 - 10:55 (მე-3 გაკვეთილი)',
    teacher: 'რუსუდან გაფრინდაშვილი',
    location: 'ბიოლოგიის კაბინეტი',
    organizer: 'რუსუდან გაფრინდაშვილი',
    description: 'პარასკევის ყოველკვირეული გამოკითხვა ბიოლოგიაში. მასწავლებელი რუსუდან გაფრინდაშვილი მიუყვება სიას. სირთულე: 8-9/10.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8 - 9 / 10',
      estimatedHours: '2 - 3 საათი',
      keyPoints: [
        'მასწავლებელი: რუსუდან გაფრინდაშვილი',
        'ყოველკვირეული გამოკითხვა სიის მიხედვით',
        'სირთულე: 8-9/10'
      ],
      strategy: 'სრულად დაამუშავეთ მიმდინარე თავი.',
      recommendation: 'მოამზადეთ კითხვებზე ზუსტი პასუხები.'
    }
  },

  // 6. ინტერვალიანი აქტივობა: პინგ-პონგის ჩემპიონატი (9 ოქტომბრიდან 23 ოქტომბრამდე)
  {
    id: 'ping-pong-champ',
    title: 'პინგ-პონგის ჩემპიონატი',
    mainCategory: 'შეჯიბრებები',
    category: 'ჩემპიონატები',
    date: '2026-10-09',
    endDate: '2026-10-23',
    time: 'დიდი შესვენებები & 14:40-ის შემდეგ',
    location: 'სკოლის სპორტული ზონა',
    organizer: 'მოსწავლეთა თვითმმართველობა & 11/5 Direction',
    description: 'სასკოლო პინგ-პონგის ჩემპიონატი — დაიწყო 9 ოქტომბერს და გრძელდება 23 ოქტომბრამდე. მიმდინარეობს ჯგუფური და პლეი-ოფის შეხვედრები.',
    importance: 'საშუალო',
    aiAnalysis: {
      difficultyScore: '7.5 / 10 (მაღალი კონკურენცია)',
      estimatedHours: '9 ოქტომბერი – 23 ოქტომბერი (2 კვირა)',
      keyPoints: [
        'ინტერვალიანი ტურნირი: 9 ოქტომბრიდან 23 ოქტომბრამდე',
        'პლეი-ოფის ბადე და ფინალური მატჩი 23 ოქტომბერს',
        'მონაწილეობენ მე-10, მე-11 და მე-12 კლასელები'
      ],
      strategy: 'შეათანხმეთ თქვენი მატჩის დრო მეტოქესთან დიდ შესვენებაზე ან მე-6 გაკვეთილის შემდეგ.',
      recommendation: '23 ოქტომბერს გაიმართება სუპერ-ფინალი — მოდით კლასელების საგულშემატკივროდ!'
    }
  },

  // 7. Hacktoberfest 2026 (17-18 ოქტომბერი) — შეჯიბრებები / ჰაკათონები
  {
    id: 'hacktoberfest-2026',
    title: 'Hacktoberfest 2026',
    mainCategory: 'შეჯიბრებები',
    category: 'ჰაკათონები/იდეათონები',
    date: '2026-10-17',
    endDate: '2026-10-18',
    time: '17-18 ოქტომბერი (48 სთ)',
    location: 'თბილისის თავისუფალი უნივერსიტეტი (Free University of Tbilisi)',
    organizer: '.devtherapy, Lovable & FLP_',
    description: 'საქართველოს ყველაზე დიდი ჰაკათონი — Hacktoberfest 2026! ორგანიზატორები: .devtherapy, Lovable და FLP_. ტარდება 17-18 ოქტომბერს თავისუფალ უნივერსიტეტში.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8.0 / 10',
      estimatedHours: '48-საათიანი სპრინტი (17-18 ოქტომბერი)',
      keyPoints: [
        'ორგანიზატორები: .devtherapy, Lovable და FLP_',
        'ლოკაცია: თბილისის თავისუფალი უნივერსიტეტი (Freeuni)',
        'MVP პროტოტიპის შექმნა და დემონსტრაცია ჟიურის წინაშე'
      ],
      strategy: 'შეკრიბეთ გუნდი წინასწარ, გამოიყენეთ Lovable და AI ხელსაწყოები სწრაფი დეველოპმენტისთვის.',
      recommendation: 'საუკეთესო ჰაკათონია საქართველოში პრაქტიკული გამოცდილებისა და CV/Common App-ის გასაძლიერებლად.'
    }
  },
  {
    id: 'cal-4',
    title: 'Startup Nest: სკოლის პრე-აქსელერატორი',
    mainCategory: 'აქტივობები',
    category: 'პრე-აქსელერაციის პროგრამები',
    date: '2026-10-24',
    time: '17:30',
    location: 'ონლაინ (Zoom)',
    organizer: 'Impact Hub Tbilisi',
    description: 'სტარტაპ იდეების ვალიდაცია, მენტორინგი ანტრეპრენუარებთან და პროდუქტის ბაზარზე გატანის სტრატეგია.',
    importance: 'საშუალო',
    aiAnalysis: {
      difficultyScore: '6.5 / 10',
      estimatedHours: 'კვირაში 3 საათი',
      keyPoints: [
        'მომხმარებლის ინტერვიუების ჩატარება',
        'ბიზნეს მოდელის (Lean Canvas) შევსება',
        'პირველადი მომხმარებლების მოზიდვა'
      ],
      strategy: 'შესანიშნავია მათთვის, ვისაც ტექნიკური პროექტი აქვს და სურს რეალურ სტარტაპად აქციოს.',
      recommendation: 'მონაწილეობა უფასოა და ფინანსდება ინოვაციების გრანტით.'
    }
  },
  {
    id: 'cal-5',
    title: 'სკოლის ეზოსა და ლაბორატორიების გამწვანება',
    mainCategory: 'აქტივობები',
    category: 'მოხალისეობრივი',
    date: '2026-10-26',
    time: '14:00 - 17:00',
    location: 'სკოლის შიდა ეზო',
    organizer: 'ეკო-კლუბი & 11/5 Direction',
    description: 'სკოლის სივრცის მოწესრიგება, მცენარეების დარგვა და მეცნიერების კაბინეტების განახლება. გაიცემა ოფიციალური მოხალისეობის სერტიფიკატი.',
    importance: 'სარეკომენდაციო',
    aiAnalysis: {
      difficultyScore: '3.0 / 10 (ფიზიკური აქტივობა)',
      estimatedHours: '3 საათი',
      keyPoints: [
        'გუნდური მუშაობა და საერთო საქმე',
        'სასკოლო გარემოს გაუმჯობესება',
        'Common App-ისთვის საათების დაგროვება'
      ],
      strategy: 'იდეალურია განტვირთვისთვის და CV-ს გასამდიდრებლად.',
      recommendation: 'გაიცემა Common App-თან თავსებადი ოფიციალური მოხალისეობის ცნობა.'
    }
  },
  {
    id: 'olympiad-math-oct28',
    title: 'ეროვნული სასწავლო ოლიმპიადა — მათემატიკის I ტური',
    mainCategory: 'ოლიმპიადები',
    category: 'ოლიმპიადები',
    date: '2026-10-28',
    time: '10:00 - 13:00',
    teacher: 'ნანა ჯაფარიძე',
    location: 'საგამოცდო ცენტრი / სკოლა',
    organizer: 'NAEC & მათემატიკის კათედრა (ნანა ჯაფარიძე)',
    description: 'ეროვნული სასწავლო ოლიმპიადის პირველი ტური მათემატიკაში მე-11 კლასელებისთვის.',
    importance: 'მაღალი',
    aiAnalysis: {
      difficultyScore: '8.5 / 10',
      estimatedHours: '3 საათი ტესტირება',
      keyPoints: [
        'კომბინატორიკა, რიცხვთა თეორია და გეომეტრია',
        'მასწავლებელი / კოორდინატორი: ნანა ჯაფარიძე',
        'მე-2 ტურში გადასასვლელი ბარიერი'
      ],
      strategy: 'გადაჭერით წინა წლების I ტურის ამოცანები.',
      recommendation: 'ოლიმპიადაში წარმატება პირდაპირ აძლიერებს საუნივერსიტეტო აპლიკაციას.'
    }
  }
];

// TIMETABLE & HOMEWORK DATA (FROM UPLOADED SCHEDULE PHOTO)
export interface TimetableSlot {
  period: number;
  time: string;
  subject: string;
  teacher?: string;
}

export interface DaySchedule {
  dayId: 'ორშაბათი' | 'სამშაბათი' | 'ოთხშაბათი' | 'ხუთშაბათი' | 'პარასკევი';
  shortLabel: string;
  slots: TimetableSlot[];
}

export const CLASS_TIMETABLE: DaySchedule[] = [
  {
    dayId: 'ორშაბათი',
    shortLabel: 'ორშ',
    slots: [
      { period: 1, time: '8:30 - 9:15', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 2, time: '9:20 - 10:05', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 3, time: '10:10 - 10:55', subject: 'ქიმია' },
      { period: 4, time: '11:20 - 12:05', subject: 'სპორტი', teacher: 'უცხ.შაბახიძე' },
      { period: 5, time: '12:10 - 12:55', subject: 'ფიზიკა', teacher: 'ა.გელაშვილი' },
      { period: 6, time: '13:05 - 13:50', subject: 'ქართული', teacher: 'თ.თვალჭრელიძე' }
    ]
  },
  {
    dayId: 'სამშაბათი',
    shortLabel: 'სამ',
    slots: [
      { period: 1, time: '8:30 - 9:15', subject: 'ფიზიკა', teacher: 'ა.გელაშვილი' },
      { period: 2, time: '9:20 - 10:05', subject: 'ფიზიკა', teacher: 'ა.გელაშვილი' },
      { period: 3, time: '10:10 - 10:55', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 4, time: '11:20 - 12:05', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 5, time: '12:10 - 12:55', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 6, time: '13:05 - 13:50', subject: 'ქართული', teacher: 'თ.თვალჭრელიძე' },
      { period: 7, time: '13:55 - 14:40', subject: 'ინგლისური', teacher: 'ბენდიაშვილი' }
    ]
  },
  {
    dayId: 'ოთხშაბათი',
    shortLabel: 'ოთხ',
    slots: [
      { period: 1, time: '8:30 - 9:15', subject: 'საქ.ისტორია', teacher: 'გ.ქორიძე' },
      { period: 2, time: '9:20 - 10:05', subject: 'ისტორია', teacher: 'გ.ქორიძე' },
      { period: 3, time: '10:10 - 10:55', subject: 'გერ/რუს', teacher: 'არაბიძე/იულია' },
      { period: 4, time: '11:20 - 12:05', subject: 'ინგლისური', teacher: 'ბენდიაშვილი' },
      { period: 5, time: '12:10 - 12:55', subject: 'გეოგრაფია', teacher: 'მ.ინწკირველი' },
      { period: 6, time: '13:05 - 13:50', subject: 'ქართული', teacher: 'თ.თვალჭრელიძე' }
    ]
  },
  {
    dayId: 'ხუთშაბათი',
    shortLabel: 'ხუთ',
    slots: [
      { period: 1, time: '8:30 - 9:15', subject: 'მოქალაქეობა', teacher: 'ი.ბოლქვაძე' },
      { period: 2, time: '9:20 - 10:05', subject: 'ფიზიკა', teacher: 'ა.გელაშვილი' },
      { period: 3, time: '10:10 - 10:55', subject: 'ფიზიკა', teacher: 'ა.გელაშვილი' },
      { period: 4, time: '11:20 - 12:05', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 5, time: '12:10 - 12:55', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 6, time: '13:05 - 13:50', subject: 'ქართული', teacher: 'თ.თვალჭრელიძე' }
    ]
  },
  {
    dayId: 'პარასკევი',
    shortLabel: 'პარ',
    slots: [
      { period: 1, time: '8:30 - 9:15', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 2, time: '9:20 - 10:05', subject: 'მათემატიკა', teacher: 'ნ.ჯაფარიძე' },
      { period: 3, time: '10:10 - 10:55', subject: 'ბიოლოგია', teacher: 'რ.გაფრინდაშვილი' },
      { period: 4, time: '11:20 - 12:05', subject: 'ეკონ. და სახ.', teacher: 'შ.ქათამაძე' },
      { period: 5, time: '12:10 - 12:55', subject: 'ქართული', teacher: 'თ.თვალჭრელიძე' },
      { period: 6, time: '13:05 - 13:50', subject: 'ქართული', teacher: 'თ.თვალჭრელიძე' }
    ]
  }
];

export interface HomeworkAssignment {
  id: string;
  date: string; // YYYY-MM-DD
  displayDate: string;
  dayOfWeek: string;
  subject: string;
  teacher: string;
  title: string;
  notes?: string;
}

// ONLY 1 HOMEWORK UPLOADED AS STRICTLY REQUESTED: მათემატიკა, 13 ოქტომბერი, "ალგ. განტოლებები 54-60"
export const INITIAL_HOMEWORKS: HomeworkAssignment[] = [
  {
    id: 'hw-1',
    date: '2026-10-13',
    displayDate: '13 ოქტომბერი',
    dayOfWeek: 'სამშაბათი',
    subject: 'მათემატიკა',
    teacher: 'ნანა ჯაფარიძე',
    title: 'ალგ. განტოლებები 54-60',
    notes: 'სამშაბათის მე-3, მე-4 და მე-5 გაკვეთილისთვის (10:10 - 12:55).'
  }
];

export interface OpportunityItem {
  id: string;
  speaker: string;
  university: string;
  badge: string;
  topic: string;
  description: string;
  date: string;
  time: string;
  location: string;
  commonAppDetails: string[];
  keyAdvice: string[];
  rsvpCount: number;
}

export const INITIAL_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: 'opp-1',
    speaker: 'გვანცა ხვედელიძე',
    university: 'Constructor University (გერმანია)',
    badge: 'ZOOM შეხვედრა',
    topic: 'ჩაბარების გზა, Common App და გამოცდილების გაზიარება',
    description: 'როგორ ჩააბარა, რა გზა გამოიარა და რჩევებს მოგვცემს. გაგვაცნობს თავის Common App-ს. კითხვების დასმა ღიად შესაძლებელია!',
    date: '25 ოქტომბერი',
    time: '19:30',
    location: 'Zoom',
    commonAppDetails: [
      'საკუთარი Common App-ის ჩვენება',
      'ჩაბარების გზა და რჩევები',
      'ღია კითხვა-პასუხი (Q&A)'
    ],
    keyAdvice: [],
    rsvpCount: 68
  },
  {
    id: 'opp-2',
    speaker: 'ლუკა მოსიაშვილი',
    university: 'Vanderbilt University (აშშ)',
    badge: 'ZOOM შეხვედრა',
    topic: 'ოლიმპიადები, კრეატიული აქტივობები და ესეები',
    description: 'მოგვიყვება თავის ოლიმპიურ მხარეზე და, რაც მთავარია, მიღწევებზე ინფორმატიკისა და ტექნიკური საგნების გარდა — კრეატიულ აქტივობებსა და ესეებზე. კითხვების დასმა ღიად შესაძლებელია!',
    date: '1 ნოემბერი',
    time: '20:00',
    location: 'Zoom',
    commonAppDetails: [
      'კრეატიული აქტივობები & ესეები',
      'ოლიმპიური და არატექნიკური მიღწევები',
      'ღია კითხვა-პასუხი (Q&A)'
    ],
    keyAdvice: [],
    rsvpCount: 84
  }
];

export interface IdeaComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface IdeaItem {
  id: string;
  title: string;
  content: string;
  category: 'სასკოლო რეფორმა' | 'ინფრასტრუქტურა' | 'მოსწავლეთა უფლებები' | 'აქტივობები';
  author: string;
  timestamp: string;
  upvotes: number;
  statusLabel: 'დამტკიცებულია' | 'განხილვაშია';
  commentsCount: number;
  comments: IdeaComment[];
}

export const INITIAL_IDEAS: IdeaItem[] = [
  {
    id: 'idea-1',
    title: '48-საათიანი ინტერვალის გარანტია ორ რთულ შემაჯამებელს შორის',
    content: 'ფიზიკისა და მათემატიკის შემაჯამებლების ერთსა და იმავე დღეს ჩატარება ქმნის გადატვირთვას. 11/5 Direction უზრუნველყოფს მინიმუმ 48-საათიან ბუფერს.',
    category: 'სასკოლო რეფორმა',
    author: 'მოსწავლე 11/5',
    timestamp: '2 საათის წინ',
    upvotes: 89,
    statusLabel: 'დამტკიცებულია',
    commentsCount: 1,
    comments: [
      {
        id: 'c1',
        author: 'ანონიმი მოსწავლე',
        content: 'ეს ყველაზე საჭირო რამაა სემესტრში. დიდი მადლობა ინიციატივისთვის.',
        timestamp: '1 საათის წინ'
      }
    ]
  },
  {
    id: 'idea-2',
    title: 'სასკოლო ბიბლიოთეკაში ჩუმი სამუშაო ზონის გაფართოება და დამტენები',
    content: 'თავისუფალ საათებში ლეპტოპებით მუშაობისთვის გვჭირდება მეტი როზეტი და კომფორტული მაგიდები მე-3 სართულის სივრცეში.',
    category: 'ინფრასტრუქტურა',
    author: 'მოსწავლე 11-A',
    timestamp: '5 საათის წინ',
    upvotes: 64,
    statusLabel: 'განხილვაშია',
    commentsCount: 1,
    comments: [
      {
        id: 'c2',
        author: '11/5 გუნდი',
        content: 'ადმინისტრაციასთან უკვე შეთანხმებულია 4 დამატებითი დამაგრძელებლის დადგმა.',
        timestamp: '3 საათის წინ'
      }
    ]
  }
];

export interface GreenLightClub {
  id: string;
  name: string;
  category: string;
  lead: string;
  room: string;
  summary: string;
  charterId: string;
}

export const INITIAL_GREEN_LIGHT_CLUBS: GreenLightClub[] = [
  {
    id: 'club-1',
    name: 'რობოტოტექნიკისა და ხელოვნური ინტელექტის გილდია',
    category: 'ტექნოლოგიები',
    lead: 'სანდრო მ. & გუნდი',
    room: 'ლაბორატორია 004',
    summary: 'ავტონომიური სისტემების აწყობა და ადგილობრივი ნეირონული ქსელების სწავლება.',
    charterId: 'CHARTER-2026-001'
  },
  {
    id: 'club-2',
    name: 'მათემატიკური მოდელირებისა და დებატების საზოგადოება',
    category: 'მეცნიერება & დებატები',
    lead: 'ლუკა კ.',
    room: 'ოთახი 312',
    summary: 'კომპლექსური ამოცანების განხილვა და სამეცნიერო თემებზე დისკუსიები.',
    charterId: 'CHARTER-2026-002'
  },
  {
    id: 'club-3',
    name: 'პინგ-პონგისა და სპორტული ტურნირების კლუბი',
    category: 'ლოგიკა & სპორტი',
    lead: 'დავით დ.',
    room: 'სპორტული სივრცე',
    summary: 'სასკოლო ჩემპიონატების ორგანიზება და ყოველდღიური ვარჯიშები.',
    charterId: 'CHARTER-2026-003'
  }
];

export interface StudyPod {
  id: string;
  subject: string;
  topic: string;
  host: string;
  time: string;
  location: string;
  maxSpots: number;
  currentSpots: number;
}

export const INITIAL_STUDY_PODS: StudyPod[] = [
  {
    id: 'pod-1',
    subject: 'მათემატიკა (ნ. ჯაფარიძე)',
    topic: '20 ოქტომბრის შემაჯამებლისთვის მომზადება: თვისებები და დამტკიცებები',
    host: 'გიორგი თ.',
    time: 'შაბათი, 15:00',
    location: 'ბიბლიოთეკა / Zoom',
    maxSpots: 8,
    currentSpots: 5
  },
  {
    id: 'pod-2',
    subject: 'ბიოლოგია (რ. გაფრინდაშვილი)',
    topic: 'პარასკევის ყოველკვირეული გამოკითხვისთვის თემების გარჩევა',
    host: 'ნინო მ.',
    time: 'ხუთშაბათი, 16:00',
    location: 'ოთახი 204',
    maxSpots: 6,
    currentSpots: 4
  }
];
