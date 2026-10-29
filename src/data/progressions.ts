/**
 * コード進行集。追加するときはこの配列に 1 件足すだけでよい。
 * chords はキー C（メジャー）／A（マイナー）での具体例。roman はローマ数字表記。
 */
import type { KeyMode } from "@/lib/music/key";

export type Genre = "J-POP" | "ロック" | "ジャズ" | "ブルース" | "R&B／ソウル" | "ポップス" | "クラシック" | "ラテン／フラメンコ" | "アニソン" | "ファンク";
export type Mood = "明るい" | "切ない" | "ドラマチック" | "おしゃれ" | "エモい" | "疾走感" | "哀愁" | "王道" | "浮遊感" | "力強い";
export type Category = "定番" | "ジャズ" | "ブルース" | "ロック" | "クラシック由来" | "マイナー";

export interface Progression {
  id: string;
  nameJa: string;
  aliases?: string[];
  category: Category;
  roman: string[];
  key: { tonic: string; mode: KeyMode };
  chords: string[];
  description: string;
  /** 使われるスケールの考え方など、演奏のヒント */
  tip?: string;
  mood: Mood[];
  genres: Genre[];
  /** 1 = 初級, 2 = 中級, 3 = 上級 */
  difficulty: 1 | 2 | 3;
  examples?: string[];
}

export const DIFFICULTY_LABEL: Record<Progression["difficulty"], string> = { 1: "初級", 2: "中級", 3: "上級" };

export const PROGRESSIONS: Progression[] = [
  {
    id: "royal-road",
    nameJa: "王道進行",
    aliases: ["4536 進行", "Ⅳ-Ⅴ-Ⅲm-Ⅵm"],
    category: "定番",
    roman: ["Ⅳmaj7", "Ⅴ7", "Ⅲm7", "Ⅵm7"],
    key: { tonic: "C", mode: "major" },
    chords: ["Fmaj7", "G7", "Em7", "Am7"],
    description:
      "J-POP のサビで最もよく使われる進行のひとつ。サブドミナント（Ⅳ）から始まり、ドミナント（Ⅴ）を経てトニックの代理（Ⅲm → Ⅵm）に落ち着くため、トニック（Ⅰ）に戻らない浮遊感と切なさが同居します。",
    tip: "4 コードともダイアトニックなので、キーのメジャースケール（C アイオニアン）1 本で弾けます。Ⅲm7 では ♭2 にあたる音（F）を長く伸ばさないのがコツ。",
    mood: ["切ない", "王道", "エモい"],
    genres: ["J-POP", "アニソン", "ポップス"],
    difficulty: 1,
    examples: ["J-POP／アニメソングのサビで非常に多く使われる定番形"],
  },
  {
    id: "canon",
    nameJa: "カノン進行",
    aliases: ["パッヘルベル進行", "Ⅰ-Ⅴ-Ⅵm-Ⅲm-Ⅳ-Ⅰ-Ⅳ-Ⅴ"],
    category: "クラシック由来",
    roman: ["Ⅰ", "Ⅴ", "Ⅵm", "Ⅲm", "Ⅳ", "Ⅰ", "Ⅳ", "Ⅴ"],
    key: { tonic: "C", mode: "major" },
    chords: ["C", "G", "Am", "Em", "F", "C", "F", "G"],
    description:
      "パッヘルベルの「カノン」に由来する 8 小節の進行。ベースが段階的に下降していく滑らかな流れが特徴で、クラシックからポップスまで幅広く使われます。Ⅴ を Ⅴ/Ⅶ（G/B）、Ⅲm を Ⅰ/Ⅲ（C/E）に置き換えると、よりベースの下降が際立ちます。",
    tip: "すべてダイアトニックなので C メジャースケールで OK。ベースラインを意識して、各コードのルート→次のルートへ滑らかにつなぐフレーズが映えます。",
    mood: ["明るい", "ドラマチック", "王道"],
    genres: ["クラシック", "J-POP", "ポップス"],
    difficulty: 1,
    examples: ["パッヘルベル「カノン」", "山下達郎「クリスマス・イブ」の間奏など、クリスマス／卒業ソングでも定番"],
  },
  {
    id: "komuro",
    nameJa: "小室進行",
    aliases: ["Ⅵm-Ⅳ-Ⅴ-Ⅰ", "6451"],
    category: "定番",
    roman: ["Ⅵm", "Ⅳ", "Ⅴ", "Ⅰ"],
    key: { tonic: "C", mode: "major" },
    chords: ["Am", "F", "G", "C"],
    description:
      "1990 年代の小室哲哉プロデュース楽曲で多用されたことからこの名で呼ばれます。マイナーの Ⅵm から始まり、Ⅳ→Ⅴ→Ⅰ と明るく解決するため、切なさと疾走感を両立できます。A マイナーの視点では Ⅰm→♭Ⅵ→♭Ⅶ→♭Ⅲ とも読めます。",
    tip: "A マイナーペンタトニック 1 本でも成立しますが、G→C の部分で C メジャー（＝A エオリアン）の 7 音を使うと解決感が出ます。",
    mood: ["疾走感", "切ない", "エモい"],
    genres: ["J-POP", "アニソン"],
    difficulty: 1,
    examples: ["1990 年代のダンス系 J-POP に多数"],
  },
  {
    id: "ii-v-i",
    nameJa: "Ⅱ-Ⅴ-Ⅰ（ツーファイブワン）",
    aliases: ["2-5-1", "ツーファイブ"],
    category: "ジャズ",
    roman: ["Ⅱm7", "Ⅴ7", "Ⅰmaj7"],
    key: { tonic: "C", mode: "major" },
    chords: ["Dm7", "G7", "Cmaj7"],
    description:
      "ジャズの最重要進行。サブドミナント→ドミナント→トニックという機能の流れを、四和音で最小限に表したものです。スタンダード曲の多くはこの Ⅱ-Ⅴ-Ⅰ を別のキーへ次々につないで作られています。",
    tip: "Ⅱm7 はドリアン、Ⅴ7 はミクソリディアン（緊張感を出すならオルタード／コンディミ）、Ⅰmaj7 はアイオニアン／リディアン。Ⅴ7 → Ⅰ の部分で 3rd と 7th を半音でつなぐ「ガイドトーン」を狙うとジャズらしくなります。",
    mood: ["おしゃれ", "王道"],
    genres: ["ジャズ", "R&B／ソウル", "ポップス"],
    difficulty: 2,
    examples: ["ジャズスタンダード全般（「Fly Me to the Moon」「Autumn Leaves」など）"],
  },
  {
    id: "minor-ii-v-i",
    nameJa: "マイナー Ⅱ-Ⅴ-Ⅰ",
    aliases: ["Ⅱm7♭5-Ⅴ7-Ⅰm7"],
    category: "ジャズ",
    roman: ["Ⅱm7♭5", "Ⅴ7", "Ⅰm7"],
    key: { tonic: "A", mode: "minor" },
    chords: ["Bm7b5", "E7", "Am7"],
    description:
      "マイナーキー版の Ⅱ-Ⅴ-Ⅰ。Ⅱ がハーフディミニッシュ（m7♭5）、Ⅴ がハーモニックマイナー由来のドミナント 7th になります。「枯葉」など、マイナーのスタンダードに頻出です。",
    tip: "Ⅱm7♭5 はロクリアン（または ロクリアン♯2）、Ⅴ7 は HmP5↓（ハーモニックマイナー・パーフェクト 5th・ビロウ）かオルタード、Ⅰm7 はエオリアン／ドリアン。A ハーモニックマイナー 1 本で通す練習も効果的です。",
    mood: ["哀愁", "おしゃれ", "ドラマチック"],
    genres: ["ジャズ", "ラテン／フラメンコ"],
    difficulty: 2,
    examples: ["「Autumn Leaves（枯葉）」「Blue Bossa」などのマイナー系スタンダード"],
  },
  {
    id: "twelve-bar-blues",
    nameJa: "12 小節ブルース",
    aliases: ["ブルース進行", "スリーコード"],
    category: "ブルース",
    roman: ["Ⅰ7", "Ⅰ7", "Ⅰ7", "Ⅰ7", "Ⅳ7", "Ⅳ7", "Ⅰ7", "Ⅰ7", "Ⅴ7", "Ⅳ7", "Ⅰ7", "Ⅴ7"],
    key: { tonic: "C", mode: "major" },
    chords: ["C7", "C7", "C7", "C7", "F7", "F7", "C7", "C7", "G7", "F7", "C7", "G7"],
    description:
      "ブルース／ロックンロールの土台となる 12 小節の形。Ⅰ・Ⅳ・Ⅴ がすべてドミナント 7th になるのが特徴で、理論上はノンダイアトニックな音（♭7、♭3）が入り混じる独特の響きになります。",
    tip: "キーのブルーススケール（C マイナーペンタ＋♭5）1 本で全体を押し切るのが王道。慣れてきたら各コードのミクソリディアンや、コードごとのメジャーペンタに切り替えると洗練されます。",
    mood: ["力強い", "王道"],
    genres: ["ブルース", "ロック", "ジャズ"],
    difficulty: 1,
    examples: ["「Johnny B. Goode」「Hound Dog」など、ブルース／ロックンロールの古典"],
  },
  {
    id: "reverse-cycle",
    nameJa: "逆循環",
    aliases: ["Ⅲm7-Ⅵ7-Ⅱm7-Ⅴ7", "3-6-2-5"],
    category: "ジャズ",
    roman: ["Ⅲm7", "Ⅵ7", "Ⅱm7", "Ⅴ7"],
    key: { tonic: "C", mode: "major" },
    chords: ["Em7", "A7", "Dm7", "G7"],
    description:
      "循環コード（Ⅰ-Ⅵ-Ⅱ-Ⅴ）を Ⅲm7 から始めた形。Ⅵ7 がセカンダリードミナント（Ⅴ7/Ⅱ）になり、Ⅱm7 へ強く引っ張ります。Ⅲm7 → Ⅵ7 → Ⅱm7 → Ⅴ7 と 4 度進行が連続するため、とても流れが良い進行です。",
    tip: "Ⅵ7（A7）は解決先の Dm7 がマイナーなので、A の HmP5↓ やオルタードで ♭9・♭13 を使うとジャズらしい響きに。",
    mood: ["おしゃれ", "王道"],
    genres: ["ジャズ", "J-POP", "R&B／ソウル"],
    difficulty: 2,
    examples: ["ジャズのイントロやエンディング、歌謡曲の A メロなど"],
  },
  {
    id: "just-the-two-of-us",
    nameJa: "Just the Two of Us 進行",
    aliases: ["丸サ進行", "Ⅳmaj7-Ⅲ7-Ⅵm7-Ⅰ7"],
    category: "ジャズ",
    roman: ["Ⅳmaj7", "Ⅲ7", "Ⅵm7", "Ⅴm7", "Ⅰ7"],
    key: { tonic: "C", mode: "major" },
    chords: ["Fmaj7", "E7", "Am7", "Gm7", "C7"],
    description:
      "グローヴァー・ワシントン Jr.「Just the Two of Us」で知られる進行。Ⅲ7 は Ⅵm7 へ向かうセカンダリードミナント、Ⅴm7 → Ⅰ7 は Ⅳ へ向かう Ⅱ-Ⅴ（関連Ⅱm7）で、ループすると Ⅳmaj7 に戻る構造です。日本では椎名林檎「丸の内サディスティック」から「丸サ進行」とも呼ばれます。",
    tip: "Ⅲ7（E7）はマイナー（Am7）へ解決するので E の HmP5↓ が定番。Ⅴm7 → Ⅰ7 は F メジャーに一時転調したつもりで G ドリアン → C ミクソリディアン。",
    mood: ["おしゃれ", "浮遊感", "エモい"],
    genres: ["R&B／ソウル", "J-POP", "ジャズ"],
    difficulty: 2,
    examples: ["Grover Washington Jr.「Just the Two of Us」", "椎名林檎「丸の内サディスティック」"],
  },
  {
    id: "rock-bVII",
    nameJa: "ロック定番進行（Ⅰ-♭Ⅶ-Ⅳ）",
    aliases: ["ミクソリディアン進行", "1-♭7-4"],
    category: "ロック",
    roman: ["Ⅰ", "♭Ⅶ", "Ⅳ", "Ⅰ"],
    key: { tonic: "C", mode: "major" },
    chords: ["C", "Bb", "F", "C"],
    description:
      "♭Ⅶ は同主調マイナーからの借用（モーダルインターチェンジ）で、ロックの力強いサウンドの核。Ⅰ-♭Ⅶ-Ⅳ の 3 コードはミクソリディアン・モードそのものとも言えます。",
    tip: "C ミクソリディアン（＝F メジャースケール）または C マイナーペンタ／ブルーススケールで全体を弾けます。♭Ⅶ の上では B♭ リディアンも美しく響きます。",
    mood: ["力強い", "明るい"],
    genres: ["ロック"],
    difficulty: 1,
    examples: ["Lynyrd Skynyrd「Sweet Home Alabama」", "Guns N' Roses「Sweet Child O' Mine」のサビ"],
  },
  {
    id: "andalusian",
    nameJa: "アンダルシア進行",
    aliases: ["スパニッシュ進行", "Ⅰm-♭Ⅶ-♭Ⅵ-Ⅴ"],
    category: "マイナー",
    roman: ["Ⅰm", "♭Ⅶ", "♭Ⅵ", "Ⅴ"],
    key: { tonic: "A", mode: "minor" },
    chords: ["Am", "G", "F", "E"],
    description:
      "フラメンコに由来する、ベースが全音・全音・半音と下降する進行。最後の Ⅴ（E）がメジャーになることでハーモニックマイナーの緊張感が生まれ、Ⅰm へ戻る強い引力を作ります。",
    tip: "A エオリアン → Ⅴ で A ハーモニックマイナー（E の HmP5↓）に切り替えるのが基本。E コード上でフリジアン・ドミナントの ♭9（F）と 3（G♯）を行き来するとスパニッシュ感が出ます。",
    mood: ["哀愁", "ドラマチック", "力強い"],
    genres: ["ラテン／フラメンコ", "ロック", "クラシック"],
    difficulty: 2,
    examples: ["Ray Charles「Hit the Road Jack」", "Dire Straits「Sultans of Swing」"],
  },
  {
    id: "jazz-turnaround",
    nameJa: "ジャズのターンアラウンド（Ⅰ-Ⅵ7-Ⅱm7-Ⅴ7）",
    aliases: ["循環コード", "1-6-2-5", "リズムチェンジ A セクション"],
    category: "ジャズ",
    roman: ["Ⅰmaj7", "Ⅵ7", "Ⅱm7", "Ⅴ7"],
    key: { tonic: "C", mode: "major" },
    chords: ["Cmaj7", "A7", "Dm7", "G7"],
    description:
      "曲の最後 2 小節で頭に戻る「ターンアラウンド」の定番。Ⅵm7 をⅥ7（セカンダリードミナント）に変えると推進力が増します。「I Got Rhythm」に代表されるリズムチェンジの A セクションもこの形です。",
    tip: "Ⅵ7 → Ⅱm7 は解決先がマイナーなので A の HmP5↓／オルタード、Ⅴ7 はミクソリディアン／オルタード。裏コード（Ⅵ7 → ♭Ⅲ7、Ⅴ7 → ♭Ⅱ7）に置き換える練習もおすすめ。",
    mood: ["おしゃれ", "王道"],
    genres: ["ジャズ"],
    difficulty: 2,
    examples: ["George Gershwin「I Got Rhythm」（リズムチェンジ）", "ジャズのエンディングのターンアラウンド全般"],
  },
  {
    id: "axis",
    nameJa: "ポップ・パンク進行（Ⅰ-Ⅴ-Ⅵm-Ⅳ）",
    aliases: ["1564", "アクシス進行", "4 コード進行"],
    category: "定番",
    roman: ["Ⅰ", "Ⅴ", "Ⅵm", "Ⅳ"],
    key: { tonic: "C", mode: "major" },
    chords: ["C", "G", "Am", "F"],
    description:
      "世界中のポップス／ロックで最も使われる 4 コード。明るい Ⅰ から始まり、Ⅵm でわずかに陰り、Ⅳ で開けて戻る、感情の起伏が自然な進行です。始める位置をずらすと小室進行（Ⅵm-Ⅳ-Ⅰ-Ⅴ）などに姿を変えます。",
    tip: "C メジャースケール／C メジャーペンタで全体 OK。Ⅵm（Am）の上では A マイナーペンタに切り替えると、同じ音を使っていてもフレーズが変わります。",
    mood: ["明るい", "王道", "エモい"],
    genres: ["ポップス", "ロック", "J-POP"],
    difficulty: 1,
    examples: ["The Beatles「Let It Be」", "U2「With or Without You」", "Journey「Don't Stop Believin'」"],
  },
  {
    id: "fifties",
    nameJa: "1950 年代進行（Ⅰ-Ⅵm-Ⅳ-Ⅴ）",
    aliases: ["スタンド・バイ・ミー進行", "ドゥーワップ進行", "1645"],
    category: "定番",
    roman: ["Ⅰ", "Ⅵm", "Ⅳ", "Ⅴ"],
    key: { tonic: "C", mode: "major" },
    chords: ["C", "Am", "F", "G"],
    description:
      "1950 年代のドゥーワップ／ロックンロールで大流行した進行。Ⅰ→Ⅵm で少し切なくなり、Ⅳ→Ⅴ→Ⅰ で王道に解決する、安心感のあるループです。",
    tip: "C メジャースケール 1 本で OK。Ⅴ（G）の上でだけ G ミクソリディアンの ♭7（F）を強調すると、ロックンロールらしいドライブ感が出ます。",
    mood: ["明るい", "王道", "切ない"],
    genres: ["ポップス", "ロック"],
    difficulty: 1,
    examples: ["Ben E. King「Stand by Me」", "The Police「Every Breath You Take」"],
  },
  {
    id: "vi-iv-i-v",
    nameJa: "Ⅵm-Ⅳ-Ⅰ-Ⅴ（エモ進行）",
    aliases: ["6415", "Ⅰm-♭Ⅵ-♭Ⅲ-♭Ⅶ"],
    category: "マイナー",
    roman: ["Ⅵm", "Ⅳ", "Ⅰ", "Ⅴ"],
    key: { tonic: "C", mode: "major" },
    chords: ["Am", "F", "C", "G"],
    description:
      "4 コード進行をⅥm から始めた形で、マイナーキー（A マイナー）では Ⅰm-♭Ⅵ-♭Ⅲ-♭Ⅶ。切なさと力強さが同居し、ロック／アニソンのサビで多用されます。最後の Ⅴ（G）が Ⅵm へ戻る瞬間の引力が特徴。",
    tip: "A マイナーペンタ／A エオリアンが基本。Ⅰ（C）と Ⅴ（G）の上では C メジャーペンタに寄せると明暗のコントラストが出ます。",
    mood: ["エモい", "切ない", "力強い"],
    genres: ["ロック", "アニソン", "J-POP"],
    difficulty: 1,
    examples: ["The Cranberries「Zombie」", "多くのアニメソング／ロックのサビ"],
  },
  {
    id: "three-chord",
    nameJa: "スリーコード（Ⅰ-Ⅳ-Ⅴ）",
    aliases: ["1-4-5", "三和音の基本"],
    category: "ロック",
    roman: ["Ⅰ", "Ⅳ", "Ⅴ", "Ⅰ"],
    key: { tonic: "C", mode: "major" },
    chords: ["C", "F", "G", "C"],
    description:
      "トニック・サブドミナント・ドミナントの 3 機能を最もシンプルに並べた形。フォーク、カントリー、パンク、童謡まで、あらゆる音楽の基礎です。",
    tip: "C メジャースケール／C メジャーペンタで OK。Ⅴ7（G7）に変えるとブルージーになり、C ブルーススケールも乗ります。",
    mood: ["明るい", "王道", "力強い"],
    genres: ["ロック", "ポップス", "ブルース"],
    difficulty: 1,
    examples: ["「La Bamba」「Twist and Shout」など"],
  },
  {
    id: "creep",
    nameJa: "Ⅰ-Ⅲ7-Ⅳ-Ⅳm（クリープ進行）",
    aliases: ["サブドミナントマイナー進行"],
    category: "ロック",
    roman: ["Ⅰ", "Ⅲ7", "Ⅳ", "Ⅳm"],
    key: { tonic: "C", mode: "major" },
    chords: ["C", "E7", "F", "Fm"],
    description:
      "Ⅲ7（セカンダリードミナント）と Ⅳm（サブドミナントマイナー）という 2 つのノンダイアトニックコードを含む、ドラマチックな進行。Ⅳ → Ⅳm で明から暗へ落ちる瞬間が最大の聴かせどころです。",
    tip: "Ⅲ7（E7）は Ⅵm へ向かう響きなので E の HmP5↓（♭9 = F が効く）。Ⅳm（Fm）は F ドリアンか F マイナーペンタで、♭3（A♭）をはっきり鳴らしましょう。",
    mood: ["ドラマチック", "切ない", "エモい"],
    genres: ["ロック", "ポップス"],
    difficulty: 2,
    examples: ["Radiohead「Creep」"],
  },
  {
    id: "secondary-dominant-chain",
    nameJa: "セカンダリードミナント連鎖（Ⅰ-Ⅲ7-Ⅵ7-Ⅱ7-Ⅴ7）",
    aliases: ["ドミナント・チェーン", "5 度圏進行"],
    category: "ジャズ",
    roman: ["Ⅰ", "Ⅲ7", "Ⅵ7", "Ⅱ7", "Ⅴ7"],
    key: { tonic: "C", mode: "major" },
    chords: ["C", "E7", "A7", "D7", "G7"],
    description:
      "ドミナント 7th が 4 度上（5 度下）へ次々と解決していく進行。各コードが次のコードのⅤ7 になっており、ラグタイムやジャズ、昭和歌謡まで幅広く使われます。",
    tip: "各ドミナントごとにスケールを切り替える練習に最適。E7 と A7 は解決先がマイナーなので HmP5↓、D7 と G7 はミクソリディアン／リディアン♭7 が合います。",
    mood: ["おしゃれ", "明るい", "ドラマチック"],
    genres: ["ジャズ", "ポップス"],
    difficulty: 3,
    examples: ["「Sweet Georgia Brown」「Five Foot Two」などのラグタイム／トラッドジャズ"],
  },
  {
    id: "minor-blues",
    nameJa: "マイナーブルース",
    aliases: ["12 小節マイナーブルース"],
    category: "ブルース",
    roman: ["Ⅰm7", "Ⅰm7", "Ⅰm7", "Ⅰm7", "Ⅳm7", "Ⅳm7", "Ⅰm7", "Ⅰm7", "♭Ⅵ7", "Ⅴ7", "Ⅰm7", "Ⅴ7"],
    key: { tonic: "A", mode: "minor" },
    chords: ["Am7", "Am7", "Am7", "Am7", "Dm7", "Dm7", "Am7", "Am7", "F7", "E7", "Am7", "E7"],
    description:
      "ブルース進行のマイナー版。9 小節目の ♭Ⅵ7 → Ⅴ7 は、Ⅴ7 に半音上から入る裏コード的な動きで、哀愁のある緊張感を作ります。",
    tip: "A マイナーペンタ／ブルーススケール 1 本で通せますが、Ⅴ7（E7）では A ハーモニックマイナー（E の HmP5↓）、♭Ⅵ7（F7）では F リディアン♭7 に切り替えると表情が豊かになります。",
    mood: ["哀愁", "力強い"],
    genres: ["ブルース", "ジャズ", "ロック"],
    difficulty: 2,
    examples: ["「The Thrill Is Gone」「Mr. P.C.」などのマイナーブルース"],
  },
  {
    id: "descending-bass",
    nameJa: "ベース下降進行（Ⅰ-Ⅴ/Ⅶ-Ⅵm-Ⅰ/Ⅴ-Ⅳ）",
    aliases: ["クリシェ", "ラインクリシェ"],
    category: "定番",
    roman: ["Ⅰ", "Ⅴ/Ⅶ", "Ⅵm", "Ⅰ/Ⅴ", "Ⅳ", "Ⅰ/Ⅲ", "Ⅱm", "Ⅴ"],
    key: { tonic: "C", mode: "major" },
    chords: ["C", "G/B", "Am", "C/G", "F", "C/E", "Dm", "G"],
    description:
      "スラッシュコード（転回形）を使ってベースを 1 音ずつ下降させる進行。コードそのものはダイアトニックのままなのに、ベースラインが旋律のように動くことでドラマチックに聞こえます。",
    tip: "ベーシストはベース音（B・G・E）を確実に鳴らすこと。ギターのリードは C メジャースケールで、ベースの下降に対して上行するラインを作ると立体的になります。",
    mood: ["ドラマチック", "切ない", "王道"],
    genres: ["J-POP", "ポップス", "クラシック"],
    difficulty: 2,
    examples: ["バラードのイントロ／A メロで頻出"],
  },
  {
    id: "lydian-vamp",
    nameJa: "Ⅰmaj7-Ⅱ7（リディアン・ヴァンプ）",
    aliases: ["Ⅰ-Ⅱ 進行", "浮遊系ヴァンプ"],
    category: "定番",
    roman: ["Ⅰmaj7", "Ⅱ7"],
    key: { tonic: "C", mode: "major" },
    chords: ["Cmaj7", "D7"],
    description:
      "Ⅱ7（Ⅴ7/Ⅴ）を解決させずに Ⅰmaj7 と行き来する、浮遊感のある 2 コードループ。Ⅱ7 の 3rd（F♯）がキーのリディアンの ♯4 にあたり、全体が C リディアン・モードのように響きます。",
    tip: "C リディアン（C D E F♯ G A B）1 本で両方のコードを弾けます。Ⅱ7（D7）の上では D ミクソリディアン＝同じ音の集合です。",
    mood: ["浮遊感", "おしゃれ"],
    genres: ["ジャズ", "R&B／ソウル", "ファンク"],
    difficulty: 2,
    examples: ["ファンク／ネオソウルのヴァンプ、映画音楽のテーマなど"],
  },
  {
    id: "backdoor",
    nameJa: "バックドア進行（Ⅳm7-♭Ⅶ7-Ⅰ）",
    aliases: ["バックドア・ドミナント", "サブドミナントマイナー終止"],
    category: "ジャズ",
    roman: ["Ⅳm7", "♭Ⅶ7", "Ⅰmaj7"],
    key: { tonic: "C", mode: "major" },
    chords: ["Fm7", "Bb7", "Cmaj7"],
    description:
      "同主調マイナーから借りた Ⅳm7 → ♭Ⅶ7 が、Ⅴ7 を使わずに裏口（バックドア）から Ⅰ へ解決する進行。Ⅱ-Ⅴ-Ⅰ より柔らかく、少し陰のある終止になります。",
    tip: "Fm7 → B♭7 は E♭メジャーの Ⅱ-Ⅴ と同じなので F ドリアン → B♭ ミクソリディアン（またはリディアン♭7）。Cmaj7 で C アイオニアン／リディアンに戻ります。",
    mood: ["おしゃれ", "切ない", "浮遊感"],
    genres: ["ジャズ", "R&B／ソウル", "J-POP"],
    difficulty: 3,
    examples: ["ジャズスタンダードのエンディングや、R&B のサビ終わり"],
  },
];

export const ALL_GENRES: Genre[] = [...new Set(PROGRESSIONS.flatMap((p) => p.genres))];
export const ALL_MOODS: Mood[] = [...new Set(PROGRESSIONS.flatMap((p) => p.mood))];
export const ALL_CATEGORIES: Category[] = ["定番", "ジャズ", "ブルース", "ロック", "マイナー", "クラシック由来"];
