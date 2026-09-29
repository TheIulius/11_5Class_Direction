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
    id: 'update_2026_09_29_v2',
    version: 'v1.2.0',
    date: '29 სექტემბერი, 2026',
    timestamp: 1790695000000,
    titleKa: 'ახალი წესები, მოთამაშის ფოტოები, 3 MVP & ფასების სისტემა',
    titleEn: 'New Rules, Player Photos, 3 MVPs & Price System',
    summaryKa: 'მნიშვნელოვანი განახლება: One Price Stadium-ის ქულების ცვლილება, მოთამაშეების რეალური ფოტოების მოთხოვნა, 3 MVP თითო მატჩში და ფასების დინამიური ზრდა.',
    summaryEn: 'Major update: One Price Stadium point adjustments, player photo requests, 3 MVPs per match, and dynamic player price rise.',
    tagKa: 'უახლესი განახლება',
    tagEn: 'Latest Update',
    items: [
      {
        id: 'one_price_pts',
        titleKa: 'One Price Stadium — ქულების დაკლება',
        titleEn: 'One Price Stadium — Points Deduction',
        descriptionKa: 'One Price Stadium-ზე გამართულ მატჩებში გოლებზე აკლდება -1 ქულა, საგოლე გადაცემებზე (ასისტებზე) -2 ქულა (ასისტში იწერება +1 ქულა +3-ის ნაცვლად). MVP-ზე რჩება -1 ქულის დაკლება.',
        descriptionEn: 'At One Price Stadium, Goals are reduced by -1 pt, Assists by -2 pts (+1 pt awarded instead of +3), and MVP by -1 pt.',
        badgeKa: 'ქულების სისტემა',
        badgeEn: 'Scoring',
        icon: 'stadium',
        highlight: true,
      },
      {
        id: 'player_photos_request',
        titleKa: 'მოთამაშის ფოტოს მოთხოვნა',
        titleEn: 'Player Photo Request Feature',
        descriptionKa: 'ნებისმიერ მენეჯერს შეუძლია მოთამაშის ბარათზე მოითხოვოს რეალური ფოტოს დამატება! ⚠️ ხუმრობა, მემები ან სპამ ფოტოები მკაცრად არ მიიღება. ყველა მოთხოვნას განიხილავს და ამტკიცებს ადმინისტრაცია.',
        descriptionEn: 'Any manager can request a real photo for any player! Spam or joke photos will be rejected. Admins review and approve all requests.',
        badgeKa: 'ახალი ფუნქცია',
        badgeEn: 'New Feature',
        icon: 'camera',
        highlight: true,
      },
      {
        id: 'rising_prices',
        titleKa: 'მოთამაშის ფასის მატება და ჩვენება',
        titleEn: 'Player Price Rise & Display',
        descriptionKa: 'მატჩის შემდეგ გამორჩეული მოთამაშეების ფასი გაიზრდება. ბარათზე ახალი ფასის ზემოთ ჩანს ძველი გადახაზული ფასი და 📈 ემოჯი. "Players" ტაბში დაემატა ფილტრი/სორტირება ფასის ზრდის მიხედვით (Rising).',
        descriptionEn: 'Player prices rise after standout performances. Pitch cards display the old crossed-out price subtly above the new price with 📈. The Players tab now has a "Rising" filter.',
        badgeKa: 'ფასები & ბაზარი',
        badgeEn: 'Market',
        icon: 'trending',
        highlight: true,
      },
      {
        id: 'three_mvps',
        titleKa: '3 MVP-ის ახალი სისტემა',
        titleEn: 'New 3-MVP System',
        descriptionKa: 'თითოეულ მატჩში 1-ის ნაცვლად ჯილდოვდება 3 საუკეთესო მოთამაშე: 🥇 1-ლი MVP: +3 ქულა, 🥈 მე-2 MVP: +2 ქულა, 🥉 მე-3 MVP: +1 ქულა (One Price Stadium-ზე: +2, +1, 0).',
        descriptionEn: '3 MVPs are awarded per match instead of 1: 1st MVP: +3 pts, 2nd MVP: +2 pts, 3rd MVP: +1 pt (at One Price: +2, +1, 0).',
        badgeKa: 'ქულების სისტემა',
        badgeEn: 'Scoring',
        icon: 'trophy',
        highlight: true,
      },
      {
        id: 'match_minutes_conceded',
        titleKa: 'მატჩის დრო (30 წთ) & გაშვებული გოლები',
        titleEn: 'Match Duration (30m) & Goals Conceded',
        descriptionKa: 'მატჩის ხანგრძლივობაა 30 წუთი (ინტერვალები: 15 წთ). მეკარე და მცველები ყოველ 2 გაშვებულ გოლზე კარგავენ 1 ქულას: floor(გაშვებული გოლები / 2). სუფთა კარისთვის: მეკარე/მცველი +4 ქულა, ნახევარმცველი +1 ქულა (20+ წთ თამაშისას).',
        descriptionEn: 'Match length is 30 mins (15m increments). GKP/DEF lose 1 pt per 2 goals conceded: floor(conceded / 2). Clean sheet: GKP/DEF +4 pts, MID +1 pt (20+ min played).',
        badgeKa: 'რეგლამენტი',
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
    summaryKa: 'კლასების მოსახერხებელი ფილტრი პარალელებით, მატჩების განრიგი თარიღებით და ადმინ პანელის გაუმჯობესებები.',
    summaryEn: 'Modern Two-Tier Class pill filter with sections, fixtures dates & sorting, and admin console enhancements.',
    tagKa: 'წინა განახლება',
    tagEn: 'Previous Update',
    items: [
      {
        id: 'two_tier_filter',
        titleKa: 'კლასების 2-დონიანი ასარჩევი ფილტრი',
        titleEn: 'Two-Tier Sliding Pill Strip',
        descriptionKa: 'ტრანსფერებსა და მოთამაშეების სიაში ჩამოსაშლელი მენიუ ჩანაცვლდა მოსახერხებელი 2-დონიანი ფილტრით (9, 10, 11, 12 კლასები და 1-7 პარალელები).',
        descriptionEn: 'Replaced dropdowns with modern two-tier sliding pills: Grades (9th-12th) and animated Sections accordion (1-7).',
        badgeKa: 'ინტერფეისი',
        badgeEn: 'UI',
        icon: 'sliders',
      },
      {
        id: 'fixtures_dates',
        titleKa: 'მატჩების განრიგი & თარიღების სორტირება',
        titleEn: 'Match Dates & Chronological Sorting',
        descriptionKa: 'თამაშებს დაემატა ზუსტი თარიღები, რომლებიც ავტომატურად ლაგდება უახლოესი თარიღის მიხედვით.',
        descriptionEn: 'Fixtures now feature exact dates and are sorted chronologically with nearest matches first.',
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
    summaryKa: 'დაიწყო ფენტეზი ჩემპიონატი: 9-კაციანი გუნდები, £55.0m ბიუჯეტი, 3 ჩიპი და კლასების ლიგები.',
    summaryEn: 'Tournament fantasy kicked off with 9-player squads, £55.0m budget, 3 power chips, and school leagues.',
    tagKa: 'ოფიციალური სტარტი',
    tagEn: 'Launch',
    items: [
      {
        id: 'squad_rules',
        titleKa: 'გუნდის წესები & ბიუჯეტი',
        titleEn: 'Squad Rules & Budget',
        descriptionKa: '9 მოთამაშე (1 GK, 3 DEF, 3 MID, 2 FWD), £55.0m სასტარტო ბიუჯეტი, მაქსიმუმ 2 მოთამაშე ერთი და იგივე კლასიდან.',
        descriptionEn: '9 players (1 GK, 3 DEF, 3 MID, 2 FWD), £55.0m starting budget, max 2 players per school class.',
        badgeKa: 'წესები',
        badgeEn: 'Rules',
        icon: 'shield',
      },
      {
        id: 'chips_power',
        titleKa: '3 სუპერ-ჩიპი: TC, BB, Wildcard',
        titleEn: '3 Strategic Power Chips',
        descriptionKa: 'Triple Captain (კაპიტნის ქულები სამმაგდება), Bench Boost (სათადარიგო მოთამაშეების ქულებიც ემატება), Wildcard (ულიმიტო უფასო ტრანსფერები).',
        descriptionEn: 'Triple Captain (3x captain pts), Bench Boost (bench players score too), Wildcard (unlimited free transfers).',
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
