export interface UpdateItem {
  id: string;
  titleKa: string;
  titleEn: string;
  descriptionKa: string;
  descriptionEn: string;
  badgeKa: string;
  badgeEn: string;
  icon: 'stadium' | 'camera' | 'trending' | 'trophy' | 'clock' | 'shield' | 'sparkles' | 'sliders';
  highlight?: boolean;
}

export interface UpdateRelease {
  id: string;
  version: string;
  date: string;
  timestamp: number;
  titleKa: string;
  titleEn: string;
  summaryKa: string;
  summaryEn: string;
  tagKa: string;
  tagEn: string;
  items: UpdateItem[];
}

export const UPDATE_NOTES: UpdateRelease[] = [
  {
    id: 'update_2026_10_10_gw1_ended_gw2_open',
    version: 'v1.3.0',
    date: '10 ოქტომბერი, 2026',
    timestamp: 1791580800000,
    titleKa: 'GW1 დასრულდა — შემადგენლობები გახსნილია! ⚽',
    titleEn: 'GW1 Finished — Lineups Open for GW2! ⚽',
    summaryKa: 'პირველი ტური დასრულდა! შემადგენლობები და ტრანსფერები გახსნილია GW2 დედლაინამდე (12/10/2026, 14:20).',
    summaryEn: 'Gameweek 1 has concluded! Lineups and transfers are open until the GW2 kickoff deadline (12/10/2026, 14:20).',
    tagKa: 'უახლესი განახლება',
    tagEn: 'Latest Update',
    items: [
      {
        id: 'gw1_ended_gw2_open',
        titleKa: '🔓 შემადგენლობები და ტრანსფერები გახსნილია GW2-სთვის!',
        titleEn: '🔓 Lineups & Transfers Open for GW2!',
        descriptionKa: 'პირველი ტური წარმატებით დასრულდა და შემადგენლობები განბლოკილია! შეგიძლიათ გამოიყენოთ უფასო ტრანსფერები, შეცვალოთ სასტარტო შემადგენლობა და კაპიტანი. ცვლილებების შეტანა შეგიძლიათ მე-2 ტურის დედლაინამდე: 12 ოქტომბერი, 2026, 14:20.',
        descriptionEn: 'Gameweek 1 has concluded and lineups are unlocked! You can now make free transfers, change your starting 6, and select your captain. Changes are allowed until the GW2 kickoff deadline: October 12, 2026 at 14:20.',
        badgeKa: 'დედლაინი ⏱️',
        badgeEn: 'Deadline ⏱️',
        icon: 'clock',
        highlight: true,
      },
      {
        id: 'gw_navigation_and_scores',
        titleKa: '📜 გასული ტურების არქივი და ქულები',
        titleEn: '📜 Past Gameweek Archive & Points',
        descriptionKa: 'Pick Team გვერდზე დაემატა ტურებს შორის გადართვის ღილაკები (< და >). შეგიძლიათ ნახოთ თქვენი GW1 შემადგენლობა, გააქტიურებული ჩიპი და მოთამაშეების მიერ აღებული ქულები.',
        descriptionEn: 'Gameweek navigation (< and >) has been added to the Pick Team page. You can easily view your GW1 squad, chips used, and the points scored by each player.',
        badgeKa: 'სიახლე ✨',
        badgeEn: 'New ✨',
        icon: 'sparkles',
      },
      {
        id: 'free_transfers_rules',
        titleKa: '🔄 უფასო ტრანსფერების წესები & გაფრთხილება',
        titleEn: '🔄 Free Transfer Rules & Warnings',
        descriptionKa: 'ყოველ ტურში გეძლევათ 1 უფასო ტრანსფერი, რომელიც არგამოყენებისას გროვდება (მაქსიმუმ 3). თუ GW1-ში ტრანსფერი არ გამოგიყენებიათ, GW2-ში გაქვთ 2 უფასო ტრანსფერი! ყოველი დამატებითი ტრანსფერი ჯარიმდება -4 ქულით საერთო ქულებიდან. ტრანსფერისას სისტემა გაგაფრთხილებთ, იყენებთ უფასო ტრანსფერს თუ -4 ქულას. დამატებითი დეტალური ინფორმაციისა და მაგალითებისთვის ეწვიეთ განყოფილებას „წესები“.',
        descriptionEn: 'Every gameweek you receive 1 free transfer, accumulating up to 3 if unused. If you made 0 transfers in GW1, you start GW2 with 2 free transfers! Additional transfers cost -4 points from your overall total. You will now see clear reminders when transferring players. For more detailed info and examples, visit the "Rules" (წესები) section.',
        badgeKa: 'წესები 📌',
        badgeEn: 'Rules 📌',
        icon: 'trending',
        highlight: true,
      },
    ],
  },
  {
    id: 'update_2026_10_01_photos_fixed',
    version: 'v1.2.5',
    date: '1 ოქტომბერი, 2026',
    timestamp: 1790873000000,
    titleKa: 'ფოტოების დამატება მუშაობს! 📸',
    titleEn: 'Player Photo Uploads are Live! 📸',
    summaryKa: 'ტექნიკური შეფერხება გასწორდა — ახლა უკვე ყველას შეუძლია მოთამაშეებს ფოტოები დაამატოს!',
    summaryEn: 'Bug fixed — now EVERYONE can add photos to players!',
    tagKa: 'წინა განახლება',
    tagEn: 'Previous Update',
    items: [
      {
        id: 'player_photos_fixed',
        titleKa: '📸 ახლა უკვე ყველას შეუძლია ფოტოების დამატება!',
        titleEn: '📸 EVERYONE can now add photos to players!',
        descriptionKa: '2-დღიანი ტექნიკური ხარვეზი გასწორებულია! ნებისმიერ მენეჯერს შეუძლია მოთამაშის ბარათზე დაჭერით მარტივად ატვირთოს ფოტო. ადმინისტრაცია განიხილავს და დაამტკიცებს.',
        descriptionEn: 'The 2-day upload bug is fixed! Every manager can now click on any player card and easily upload a photo. Admins will review and approve.',
        badgeKa: 'გასწორდა ✅',
        badgeEn: 'Fixed ✅',
        icon: 'camera',
        highlight: true,
      },
    ],
  },
  {
    id: 'update_2026_09_29_v2',
    version: 'v1.2.0',
    date: '29 სექტემბერი, 2026',
    timestamp: 1790695000000,
    titleKa: 'ახალი წესები, მოთამაშის ფოტოები, 3 MVP & ფასები',
    titleEn: 'New Rules, Player Photos, 3 MVPs & Prices',
    summaryKa: 'მთავარი სიახლეები: მოთამაშის ფოტოების დამატება, One Price Stadium-ის ქულები, 3 MVP და ფასების ზრდა.',
    summaryEn: 'Key updates: Add photos to players, One Price Stadium scoring, 3 MVPs per match, and player price rise.',
    tagKa: 'წინა განახლება',
    tagEn: 'Previous Update',
    items: [
      {
        id: 'manager_class_profile',
        titleKa: '🏫 კლასისა (Grade & Parallel) და სახელის მითითება',
        titleEn: '🏫 Grade, Section & Real Name Details',
        descriptionKa: 'ყველა მენეჯერმა უნდა მიუთითოს საკუთარი კლასი, პარალელი, სახელი და გვარი. ასევე შეგიძლიათ აირჩიოთ, გამოჩნდეს თუ არა თქვენი რეალური სახელი საჯაროდ ლიდერბორდზე.',
        descriptionEn: 'Managers must specify their grade, parallel, and full name. You can also choose if your real name is displayed publicly.',
        badgeKa: 'პროფილი',
        badgeEn: 'Profile',
        icon: 'sliders',
      },
      {
        id: 'player_photos_request',
        titleKa: '📸 დაამატეთ ფოტოები მოთამაშეებს!',
        titleEn: '📸 Add Photos to Players!',
        descriptionKa: 'გახადეთ მოთამაშეები ცნობადი! ნებისმიერ მენეჯერს შეუძლია მოითხოვოს რეალური ფოტოს დაყენება მოთამაშის ბარათიდან. ადმინისტრაცია განიხილავს და დაამტკიცებს. (სპამი ან ხუმრობა ფოტოები არ მიიღება).',
        descriptionEn: 'Make players recognizable! Anyone can request a real photo from the player card. Admins review and approve. (No spam/meme photos).',
        badgeKa: '🔥 მთავარი სიახლე',
        badgeEn: '🔥 Featured',
        icon: 'camera',
        highlight: true,
      },
      {
        id: 'one_price_pts',
        titleKa: 'One Price Stadium — ქულების დაკლება',
        titleEn: 'One Price Stadium — Points Deduction',
        descriptionKa: 'One Price Stadium-ზე გოლებსა და ასისტებზე აკლდება -2 ქულა (ასისტზე იწერება +1 ქულა +3-ის ნაცვლად). MVP-ზე აკლდება -1 ქულა.',
        descriptionEn: 'At One Price Stadium: Goals and Assists are reduced by -2 pts (+1 pt awarded for assist instead of +3), MVP reduced by -1 pt.',
        badgeKa: 'ქულები',
        badgeEn: 'Scoring',
        icon: 'stadium',
      },
      {
        id: 'rising_prices',
        titleKa: 'მოთამაშის ფასის მატება & 📈 ემოჯი',
        titleEn: 'Player Price Rise & 📈 Display',
        descriptionKa: 'მატჩის შემდეგ გამორჩეული მოთამაშეების ფასი იზრდება. ბარათზე ახალი ფასის ზემოთ ჩანს ძველი გადახაზული ფასი და 📈. Players ტაბში დაემატა "Rising" სორტირება.',
        descriptionEn: 'Standout players rise in price. Old crossed-out price displays above new price with 📈. "Rising" filter added in Players tab.',
        badgeKa: 'ბაზარი',
        badgeEn: 'Market',
        icon: 'trending',
      },
      {
        id: 'three_mvps',
        titleKa: '3 MVP თითოეულ მატჩში',
        titleEn: '3 MVPs per Match',
        descriptionKa: '1-ის ნაცვლად ჯილდოვდება 3 მოთამაშე: 🥇 1-ლი MVP (+3), 🥈 მე-2 MVP (+2), 🥉 მე-3 MVP (+1). (One Price-ზე: +2, +1, 0).',
        descriptionEn: '3 players awarded per match: 1st MVP (+3 pts), 2nd MVP (+2 pts), 3rd MVP (+1 pt). (At One Price: +2, +1, 0).',
        badgeKa: 'ქულები',
        badgeEn: 'Scoring',
        icon: 'trophy',
      },
      {
        id: 'match_minutes_conceded',
        titleKa: 'მატჩის დრო (30 წთ) & გაშვებული გოლები',
        titleEn: 'Match Length (30m) & Goals Conceded',
        descriptionKa: 'მატჩი გრძელდება 30 წთ (15 წთ ბიჯით). მცველებსა და მეკარეს ყოველ 2 გაშვებულ გოლზე აკლდებათ -1 ქულა. სუფთა კარი: GK/DEF +4, MID +1 (20+ წთ).',
        descriptionEn: '30m matches. GKP/DEF lose -1 pt per 2 goals conceded. Clean sheet: GK/DEF +4, MID +1 (20+ min).',
        badgeKa: 'წესები',
        badgeEn: 'Rules',
        icon: 'clock',
      },
    ],
  },
  {
    id: 'update_2026_09_28_v1',
    version: 'v1.1.0',
    date: '28 სექტემბერი, 2026',
    timestamp: 1790600000000,
    titleKa: 'კლასების 2-დონიანი ფილტრი და მატჩების განრიგი',
    titleEn: 'Two-Tier Class Filter & Fixtures Schedule',
    summaryKa: 'კლასების მოსახერხებელი ფილტრი პარალელებით და მატჩების განრიგი.',
    summaryEn: 'Modern Two-Tier Class pill filter with sections and fixtures dates.',
    tagKa: 'წინა განახლება',
    tagEn: 'Previous Update',
    items: [
      {
        id: 'two_tier_filter',
        titleKa: 'კლასების 2-დონიანი ასარჩევი ფილტრი',
        titleEn: 'Two-Tier Sliding Pill Strip',
        descriptionKa: 'ტრანსფერებსა და მოთამაშეების სიაში ჩამოსაშლელი მენიუ ჩანაცვლდა მოსახერხებელი 2-დონიანი ფილტრით (9-12 კლასები და 1-7 პარალელები).',
        descriptionEn: 'Replaced dropdowns with modern two-tier sliding pills: Grades (9th-12th) and Sections (1-7).',
        badgeKa: 'ინტერფეისი',
        badgeEn: 'UI',
        icon: 'sliders',
      },
      {
        id: 'fixtures_dates',
        titleKa: 'მატჩების განრიგი & თარიღების სორტირება',
        titleEn: 'Match Dates & Chronological Sorting',
        descriptionKa: 'თამაშებს დაემატა ზუსტი თარიღები და ავტომატურად ლაგდება უახლოესი თარიღის მიხედვით.',
        descriptionEn: 'Fixtures feature exact dates and are sorted chronologically with nearest matches first.',
        badgeKa: 'მატჩები',
        badgeEn: 'Fixtures',
        icon: 'clock',
      },
    ],
  },
  {
    id: 'update_2026_09_25_v0',
    version: 'v1.0.0',
    date: '25 სექტემბერი, 2026',
    timestamp: 1790350000000,
    titleKa: 'კომაროვის საქველმოქმედო ლიგის ფენტეზის ოფიციალური სტარტი',
    titleEn: 'Official Launch of Komarovi Charity League Fantasy',
    summaryKa: 'დაიწყო ფენტეზი ჩემპიონატი: 9-კაციანი გუნდები, £55.0m ბიუჯეტი და 3 ჩიპი.',
    summaryEn: 'Tournament fantasy kicked off with 9-player squads, £55.0m budget, and 3 power chips.',
    tagKa: 'ოფიციალური სტარტი',
    tagEn: 'Launch',
    items: [
      {
        id: 'squad_rules',
        titleKa: 'გუნდის წესები & ბიუჯეტი',
        titleEn: 'Squad Rules & Budget',
        descriptionKa: '9 მოთამაშე (1 GK, 3 DEF, 3 MID, 2 FWD), £55.0m ბიუჯეტი, მაქსიმუმ 2 მოთამაშე ერთი კლასიდან.',
        descriptionEn: '9 players (1 GK, 3 DEF, 3 MID, 2 FWD), £55.0m starting budget, max 2 players per class.',
        badgeKa: 'წესები',
        badgeEn: 'Rules',
        icon: 'shield',
      },
      {
        id: 'chips_power',
        titleKa: '3 სუპერ-ჩიპი: TC, BB, Wildcard',
        titleEn: '3 Strategic Power Chips',
        descriptionKa: 'Triple Captain (კაპიტანი x3), Bench Boost (სკამის ქულებიც ითვლება), Wildcard (ულიმიტო უფასო ტრანსფერები).',
        descriptionEn: 'Triple Captain (3x captain pts), Bench Boost (bench players score too), Wildcard (unlimited transfers).',
        badgeKa: 'ჩიპები',
        badgeEn: 'Chips',
        icon: 'sparkles',
      },
    ],
  },
];

export const LATEST_UPDATE = UPDATE_NOTES[0];

export function getManagerSeenUpdateKey(managerId: string): string {
  return `kcl_seen_update_${managerId}`;
}

export function hasManagerSeenLatestUpdate(managerId: string): boolean {
  if (typeof window === 'undefined' || !managerId) return true;
  try {
    const seenId = localStorage.getItem(getManagerSeenUpdateKey(managerId));
    return seenId === LATEST_UPDATE.id;
  } catch {
    return true;
  }
}

export function markLatestUpdateSeen(managerId: string): void {
  if (typeof window === 'undefined' || !managerId) return;
  try {
    localStorage.setItem(getManagerSeenUpdateKey(managerId), LATEST_UPDATE.id);
  } catch (err) {
    console.error('Failed to mark update as seen', err);
  }
}
