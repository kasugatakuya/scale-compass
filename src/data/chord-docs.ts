/**
 * コード解説ページのコンテンツ。追加するときはこの配列に 1 件足すだけでよい。
 */
import type { ChordQuality } from "@/lib/music/chords";
import type { KeyMode } from "@/lib/music/key";
import type { ScaleId } from "@/lib/music/scales";

export type DocGroup = "triad" | "seventh" | "ninth" | "extended" | "dominant" | "theory" | "inversion";

export const DOC_GROUP_LABEL: Record<DocGroup, string> = {
  triad: "三和音（トライアド）",
  seventh: "セブンス系（四和音）",
  ninth: "ナインス系",
  extended: "11th・13th",
  dominant: "ドミナント 7th の役割とテンション",
  theory: "ダイアトニックコードと機能",
  inversion: "転回形とスラッシュコード",
};

export const DOC_GROUP_ORDER: DocGroup[] = ["triad", "seventh", "ninth", "extended", "dominant", "theory", "inversion"];

export interface ChordDoc {
  /** URL スラッグ（/chords/[type]） */
  slug: string;
  title: string;
  subtitle?: string;
  group: DocGroup;
  /** コードそのものの解説なら品質 ID */
  quality?: ChordQuality;
  /** C を例にしたコード（指板・ダイアグラム・試聴に使う） */
  exampleChord: string;
  /** 例の進行（解説の中で解析して表示） */
  exampleProgression?: { key: { tonic: string; mode: KeyMode }; chords: string[]; caption: string };
  /** 構成音（度数） */
  formula: string[];
  sound: string;
  usage: string;
  scales: ScaleId[];
  tips: { guitar: string; bass: string };
  glossary?: { term: string; meaning: string }[];
  /** 本文の段落 */
  body: string[];
  /** 関連する解説のスラッグ */
  related?: string[];
}

export const CHORD_DOCS: ChordDoc[] = [
  // ───────── 三和音 ─────────
  {
    slug: "major",
    title: "メジャーコード",
    subtitle: "C, Cmaj, CM",
    group: "triad",
    quality: "maj",
    exampleChord: "C",
    formula: ["R", "3", "5"],
    sound: "明るく、安定した響き。すべてのコードの基準になる「ふつうの和音」です。",
    usage: "キーのⅠ・Ⅳ・Ⅴに現れる最も基本的なコード。ポップス、ロック、フォークの土台。",
    scales: ["ionian", "lydian", "major-pentatonic", "mixolydian", "ryukyu"],
    tips: {
      guitar: "C・A・G・E・D の 5 つのオープンコードが、そのまま移動可能なバレーコード（CAGED システム）の原型になります。まずは E フォームと A フォームのバレーを押さえられるようにしましょう。",
      bass: "ルート→5 度→オクターブ上のルートの三角形が基本。3 度（長 3 度）を加えると明るさを強調できますが、コードが鳴っているときは 3 度を長く伸ばしすぎないのが無難です。",
    },
    glossary: [
      { term: "トライアド（三和音）", meaning: "ルート・3 度・5 度の 3 音で作る和音。" },
      { term: "長 3 度", meaning: "ルートから半音 4 つ上の音。メジャーの「明るさ」を決める音。" },
    ],
    body: [
      "メジャーコードはルート（R）に長 3 度と完全 5 度を重ねた 3 音の和音です。たとえば C なら C・E・G。3 度が「長い（ルートから半音 4 つ）」ことで明るく聞こえます。",
      "コードネームにサフィックスが何もついていなければメジャーコードです（C = C メジャー）。「CM」「Cmaj」と書くこともありますが、小文字の「Cm」はマイナーなので注意しましょう。",
      "スケールを選ぶときは、そのコードがキーの中でどの役割（Ⅰ・Ⅳ・Ⅴ）かで決まります。Ⅰならアイオニアン、Ⅳならリディアン、Ⅴならミクソリディアン。迷ったらメジャーペンタトニックが外しません。",
    ],
    related: ["minor", "diatonic", "function"],
  },
  {
    slug: "minor",
    title: "マイナーコード",
    subtitle: "Cm, Cmin, C-",
    group: "triad",
    quality: "min",
    exampleChord: "Cm",
    formula: ["R", "♭3", "5"],
    sound: "暗く、切ない、落ち着いた響き。",
    usage: "メジャーキーのⅡm・Ⅲm・Ⅵm、マイナーキーのⅠm・Ⅳm・Ⅴm に現れる。",
    scales: ["aeolian", "dorian", "phrygian", "minor-pentatonic", "blues"],
    tips: {
      guitar: "E フォーム（6 弦ルート）と A フォーム（5 弦ルート）のマイナーバレーが基本。メジャーとの違いは 3 度の音を 1 フレット下げるだけです。",
      bass: "ルート・♭3・5 のアルペジオで「マイナーらしさ」を出せます。ルートと 5 度を軸に、♭3 を経過的に入れると滑らかなラインになります。",
    },
    glossary: [{ term: "短 3 度", meaning: "ルートから半音 3 つ上の音。マイナーの「暗さ」を決める音。" }],
    body: [
      "マイナーコードはメジャーコードの 3 度を半音下げた（短 3 度にした）和音です。C なら C・E♭・G。たった 1 音の違いで、明るい響きが暗く・切なくなります。",
      "表記は「Cm」が一般的で、ジャズの譜面では「C-」とも書かれます。",
      "どのマイナースケールを使うかは、コードがキーのどこにあるかで変わります。Ⅱm ならドリアン（6 度が長い）、Ⅲm ならフリジアン（2 度が短い）、Ⅵm ならエオリアン。マイナーペンタトニックはどの場合でも安全です。",
    ],
    related: ["major", "minor7", "diatonic"],
  },
  {
    slug: "diminished",
    title: "ディミニッシュコード",
    subtitle: "Cdim, C°",
    group: "triad",
    quality: "dim",
    exampleChord: "Cdim",
    formula: ["R", "♭3", "♭5"],
    sound: "不安定で緊張感のある響き。「次へ進みたい」気持ちを強く作ります。",
    usage: "メジャーキーのⅦdim、経過コード（半音でつなぐ）、ドミナントの代理として。",
    scales: ["locrian", "diminished"],
    tips: {
      guitar: "三和音の dim は 3 本の弦で小さく押さえるのが実用的。実際の曲では dim7（4 音）として弾くことがほとんどです。",
      bass: "ルートと ♭5 を強調すると「不安定さ」が伝わります。次のコードのルートへ半音で滑り込むラインが効果的。",
    },
    glossary: [{ term: "減 5 度（♭5）", meaning: "完全 5 度を半音下げた音。ルートとの距離は半音 6 つ（トライトーン）。" }],
    body: [
      "ディミニッシュ（減三和音）は、マイナーコードの 5 度まで半音下げた和音です。C なら C・E♭・G♭。短 3 度を 2 つ積み重ねた形で、ルートと ♭5 の間が「トライトーン」という最も不安定な音程になります。",
      "メジャーキーでは Ⅶ の位置（C メジャーなら Bdim）に現れ、Ⅴ7 のルート省略形としてトニックへ解決します。",
      "半音で隣り合うコードの間に挟む「経過ディミニッシュ」としての使い方（C → C♯dim → Dm）も定番です。",
    ],
    related: ["diminished7", "half-diminished", "dominant-role"],
  },
  {
    slug: "augmented",
    title: "オーギュメントコード",
    subtitle: "Caug, C+, C(♯5)",
    group: "triad",
    quality: "aug",
    exampleChord: "Caug",
    formula: ["R", "3", "♯5"],
    sound: "浮遊感があり、どこへ行くか分からない不思議な緊張感。",
    usage: "Ⅰ → Ⅰaug → Ⅵm や Ⅰ → Ⅰaug → Ⅳ のように、5 度を半音ずつ動かす「クリシェ」で多用。",
    scales: ["whole-tone", "lydian-augmented", "harmonic-minor"],
    tips: {
      guitar: "長 3 度を積み重ねた左右対称の構造なので、同じフォームを 4 フレットずつ動かしても同じコードになります。",
      bass: "ルートの上で ♯5 を鳴らすと浮遊感が強調されます。次のコードの 5 度や 6 度へ半音で動くラインが定番。",
    },
    glossary: [{ term: "増 5 度（♯5）", meaning: "完全 5 度を半音上げた音。" }],
    body: [
      "オーギュメント（増三和音）はメジャーコードの 5 度を半音上げた和音です。C なら C・E・G♯。長 3 度を 2 つ重ねた形で、オクターブを 3 等分する対称的な構造です。",
      "単体で長く鳴らすことは少なく、「C → Caug → C6 → C7」のように内声を半音ずつ動かす流れの中で、次のコードへの橋渡しとして使われます。",
      "スケールはホールトーン（全音音階）がぴったりはまります。ハーモニックマイナーの ♭Ⅲ+ として出てきた場合は、そのキーのハーモニックマイナーも使えます。",
    ],
    related: ["major", "dominant7-tensions"],
  },
  {
    slug: "sus",
    title: "サスフォー／サスツー",
    subtitle: "Csus4, Csus2, C7sus4",
    group: "triad",
    quality: "sus4",
    exampleChord: "Csus4",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["Gsus4", "G", "C"], caption: "sus4 → メジャーへ解決する定番の動き" },
    formula: ["R", "4（または 2）", "5"],
    sound: "メジャーでもマイナーでもない、開いた・保留された響き。",
    usage: "sus4 → メジャーの解決（G sus4 → G）、ロックのリフ、sus2 のアルペジオ。",
    scales: ["mixolydian", "major-pentatonic", "dorian"],
    tips: {
      guitar: "オープンコードの D・A・E では、3 度の指を 1 本動かすだけで sus4／sus2 を行き来できます。アルペジオで sus2 ⇄ メジャーを揺らすのはロックの定番。",
      bass: "3 度がないので、ベースが 3 度を弾くとコードの意図が崩れます。ルート・4 度（または 2 度）・5 度を使いましょう。",
    },
    glossary: [{ term: "サスペンデッド（sus）", meaning: "「吊るした」の意味。3 度を 4 度や 2 度に置き換えて解決を保留した状態。" }],
    body: [
      "sus コードは 3 度を抜き、代わりに 4 度（sus4）か 2 度（sus2）を入れた和音です。3 度がないため明るいとも暗いとも言えず、「保留された」響きになります。",
      "伝統的な使い方は Gsus4 → G のように、4 度が 3 度へ解決する動き（ドミナント上でよく使う）。ロックやポップスでは解決させずに響きそのものを楽しみます。",
      "7sus4（C7sus4 = C・F・G・B♭）はジャズやファンクで、ドミナントの代わりに使う柔らかいコードです。",
    ],
    related: ["major", "dominant7"],
  },

  // ───────── セブンス ─────────
  {
    slug: "dominant7",
    title: "セブンス（ドミナント 7th）",
    subtitle: "C7",
    group: "seventh",
    quality: "7",
    exampleChord: "C7",
    exampleProgression: { key: { tonic: "F", mode: "major" }, chords: ["Gm7", "C7", "Fmaj7"], caption: "C7 は F メジャーの Ⅴ7。Fmaj7 へ解決する" },
    formula: ["R", "3", "5", "♭7"],
    sound: "少しざらついた、解決を求める響き。ブルースでは「それ自体が落ち着く場所」として使われます。",
    usage: "キーのⅤ7、セカンダリードミナント、ブルースの Ⅰ7・Ⅳ7・Ⅴ7。",
    scales: ["mixolydian", "lydian-b7", "altered", "combination-of-diminished", "blues", "bebop-dominant"],
    tips: {
      guitar: "E7・A7 のオープンコードと、6 弦／5 弦ルートのバレーフォームを覚えれば大半の曲に対応できます。3 度と ♭7 だけの 2 音（シェルボイシング）でもコードは成立します。",
      bass: "ルート → 3 → 5 → ♭7（ウォーキング）や、ルート・♭7 の往復がドミナントらしいライン。♭7 から次のルートへ半音下で入るとスムーズです。",
    },
    glossary: [
      { term: "短 7 度（♭7）", meaning: "ルートから半音 10 個上の音。メジャーコードに加えると「セブンス」になる。" },
      { term: "トライトーン", meaning: "半音 6 つ分の音程。7th コードの 3 度と ♭7 の間にあり、不安定さの源。" },
    ],
    body: [
      "セブンスコード（ドミナント 7th）はメジャーコードに短 7 度を加えた 4 音の和音です。C7 なら C・E・G・B♭。3 度（E）と ♭7（B♭）の間がトライトーンになり、これが「解決したい」という引力を生みます。",
      "「7」とだけ書かれていればこのコードです。maj7（長 7 度）とは別物なので注意してください。",
      "キーのⅤに現れるのが基本（C メジャーなら G7）。ほかのコードへ向かうセカンダリードミナントや、ブルースでは Ⅰ・Ⅳ・Ⅴ すべてがセブンスになります。",
      "スケールは基本がミクソリディアン。解決先がマイナーなら HmP5↓、緊張感を高めたいならオルタードやコンビネーション・オブ・ディミニッシュ、解決しないならリディアン♭7 が合います。",
    ],
    related: ["dominant-role", "tritone-substitution", "dominant7-tensions", "major7"],
  },
  {
    slug: "major7",
    title: "メジャーセブンス",
    subtitle: "Cmaj7, CM7, C△7",
    group: "seventh",
    quality: "maj7",
    exampleChord: "Cmaj7",
    formula: ["R", "3", "5", "7"],
    sound: "おしゃれで透明感のある、ふわっとした響き。",
    usage: "キーのⅠmaj7・Ⅳmaj7。シティポップ、ジャズ、ボサノヴァ、R&B の定番。",
    scales: ["ionian", "lydian", "major-pentatonic"],
    tips: {
      guitar: "ルートと長 7 度が半音違いで隣り合うので、ボイシングでは離して配置するときれいに響きます。6 弦ルートなら「R・x・7・3・5・x」の 4 音フォームが定番。",
      bass: "長 7 度はルートの半音下。ルート → 5 → 7 → ルートのように、7 度から半音上のルートへ戻るラインが美しく聞こえます。",
    },
    glossary: [{ term: "長 7 度", meaning: "ルートから半音 11 個上の音。ルートの半音下と同じ。" }],
    body: [
      "メジャーセブンスはメジャーコードに長 7 度を加えた和音です。Cmaj7 なら C・E・G・B。ドミナント 7th（C7）と違って解決を求めず、その場に留まる落ち着いた響きです。",
      "表記ゆれが多いコードで、「CM7」「C△7」「CΔ7」「Cma7」はすべて同じ意味。大文字 M は maj、小文字 m はマイナーです。",
      "Ⅰmaj7 の上ではアイオニアン（4 度に注意）、Ⅳmaj7 の上ではリディアン。リディアンは maj7 のどんな場面でもアヴォイドがなく、浮遊感を足せる便利なスケールです。",
    ],
    related: ["dominant7", "major9", "diatonic"],
  },
  {
    slug: "minor7",
    title: "マイナーセブンス",
    subtitle: "Cm7, C-7",
    group: "seventh",
    quality: "m7",
    exampleChord: "Cm7",
    formula: ["R", "♭3", "5", "♭7"],
    sound: "マイナーの暗さがやわらぎ、しっとりとした大人っぽい響き。",
    usage: "メジャーキーのⅡm7・Ⅲm7・Ⅵm7、マイナーキーのⅠm7・Ⅳm7。Ⅱ-Ⅴ-Ⅰ の Ⅱ。",
    scales: ["dorian", "aeolian", "phrygian", "minor-pentatonic", "blues"],
    tips: {
      guitar: "6 弦ルートの Em7 型（R・5・♭7・♭3・5・R）は指 1 本のバレーだけで押さえられる最も楽なフォーム。ファンクでは 4 弦〜1 弦だけのカッティングが定番。",
      bass: "ルート・♭3・5・♭7 のボックス型アルペジオが指板上でコンパクトに収まります。♭7 → ルートの全音の動きを活用しましょう。",
    },
    body: [
      "マイナーセブンスはマイナーコードに短 7 度を加えた和音です。Cm7 なら C・E♭・G・B♭。ジャズやポップスでは単なるマイナーコードよりこちらを使うことが多く、響きが柔らかくなります。",
      "ジャズでは「C-7」と書かれます。",
      "どのスケールが合うかは位置で決まります。Ⅱm7 ならドリアン、Ⅲm7 ならフリジアン、Ⅵm7（マイナーキーのⅠm7）ならエオリアン。構成音だけ見ればドリアンが最もアヴォイドが少なく万能です。",
    ],
    related: ["minor", "minor9", "half-diminished"],
  },
  {
    slug: "half-diminished",
    title: "マイナーセブンス・フラットファイブ（ハーフディミニッシュ）",
    subtitle: "Cm7♭5, Cø",
    group: "seventh",
    quality: "m7b5",
    exampleChord: "Cm7b5",
    exampleProgression: { key: { tonic: "A", mode: "minor" }, chords: ["Bm7b5", "E7", "Am7"], caption: "マイナー Ⅱ-Ⅴ-Ⅰ の Ⅱ として最もよく使われる" },
    formula: ["R", "♭3", "♭5", "♭7"],
    sound: "暗く、切なく、少し不安定。マイナーへ向かう入口の響き。",
    usage: "メジャーキーのⅦm7♭5、マイナーキーのⅡm7♭5（マイナー Ⅱ-Ⅴ-Ⅰ）。",
    scales: ["locrian", "locrian-#2"],
    tips: {
      guitar: "m7 コードの 5 度を 1 フレット下げるだけ。5 弦ルートの「x・R・♭5・♭7・♭3・x」が最もよく使われるフォームです。",
      bass: "♭5 を含むため、ルート・♭3・♭5・♭7 の 4 音はすべて短 3 度ずつ（最後だけ長 3 度）。ルートと ♭5 を使うと不安定さが出ます。",
    },
    glossary: [
      { term: "ハーフディミニッシュ（ø）", meaning: "dim7 と比べて 7 度が半音高い（短 7 度）ことから「半分の」ディミニッシュと呼ばれる。" },
    ],
    body: [
      "m7♭5 はマイナーセブンスの 5 度を半音下げた和音です。Cm7♭5 なら C・E♭・G♭・B♭。ディミニッシュ三和音に短 7 度を乗せた形で、ジャズでは「ø」（ハーフディミニッシュ）の記号で書かれます。",
      "最もよく出てくる場面はマイナーキーの Ⅱ-Ⅴ-Ⅰ（Bm7♭5 → E7 → Am7）。メジャーキーのⅦm7♭5 としても現れます。",
      "スケールは基本がロクリアン。♭2 がアヴォイドになるので、長 2 度（9th）を使えるロクリアン♯2 に替えると、より洗練された響きになります。",
    ],
    related: ["diminished7", "minor7", "diminished"],
  },
  {
    slug: "diminished7",
    title: "ディミニッシュセブンス",
    subtitle: "Cdim7, C°7",
    group: "seventh",
    quality: "dim7",
    exampleChord: "Cdim7",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["C", "C#dim7", "Dm7", "G7"], caption: "C と Dm7 の間を半音でつなぐ経過ディミニッシュ" },
    formula: ["R", "♭3", "♭5", "♭♭7（=6）"],
    sound: "強い緊張感とスリル。古い映画の「ピンチの場面」のような響き。",
    usage: "経過ディミニッシュ（半音でつなぐ）、ドミナント 7(♭9) の代理、マイナーキーのⅦdim7。",
    scales: ["diminished", "phrygian-dominant"],
    tips: {
      guitar: "短 3 度ずつ積んだ対称形なので、同じフォームを 3 フレットずつ動かしても同じコードになります（Cdim7 = E♭dim7 = G♭dim7 = Adim7）。",
      bass: "ルートから短 3 度ずつ上がる（C → E♭ → G♭ → A）アルペジオが、そのまま dim7 のラインになります。",
    },
    glossary: [{ term: "減 7 度（♭♭7）", meaning: "短 7 度をさらに半音下げた音。実音は長 6 度と同じ。" }],
    body: [
      "dim7 はディミニッシュ三和音に減 7 度を加えた 4 音の和音です。Cdim7 なら C・E♭・G♭・A（B♭♭）。すべての音が短 3 度間隔で並ぶ、完全に対称な構造です。",
      "ルートを省略した 7(♭9) と同じ構成音になるため、ドミナントの代理として使えます。たとえば C♯dim7 は A7(♭9) のルート抜きで、Dm7 へ解決します。",
      "スケールはディミニッシュ・スケール（ホール・ハーフ）。ドミナントの代理として見るなら、解決先のハーモニックマイナー（HmP5↓）も使えます。",
    ],
    related: ["diminished", "half-diminished", "dominant7-tensions"],
  },
  {
    slug: "minor-major7",
    title: "マイナーメジャーセブンス",
    subtitle: "CmMaj7, Cm(maj7), C-△7",
    group: "seventh",
    quality: "mMaj7",
    exampleChord: "CmMaj7",
    formula: ["R", "♭3", "5", "7"],
    sound: "ミステリアスでサスペンスのある響き。映画音楽やボサノヴァで印象的に使われます。",
    usage: "マイナーキーのⅠmMaj7、Ⅰm → ⅠmMaj7 → Ⅰm7 → Ⅰm6 のラインクリシェ。",
    scales: ["melodic-minor", "harmonic-minor"],
    tips: {
      guitar: "m7 フォームの ♭7 を 1 フレット上げるだけ。クリシェでは最高音だけを動かすフォームを選ぶと効果的です。",
      bass: "長 7 度はルートの半音下。ルートと 5 度を中心にしつつ、7 度から半音上のルートへ戻る動きを使うとコードの個性が出ます。",
    },
    body: [
      "mMaj7 はマイナーコードに長 7 度を加えた和音です。CmMaj7 なら C・E♭・G・B。マイナーの暗さと長 7 度の緊張感が同居し、独特のミステリアスな響きになります。",
      "単独で使うより「Am → AmMaj7 → Am7 → Am6」のように、最高音を半音ずつ下げる「ラインクリシェ」の中で出てくることが多いコードです。",
      "スケールはメロディックマイナーかハーモニックマイナー。どちらも長 7 度を含むマイナースケールです。",
    ],
    related: ["minor7", "augmented"],
  },

  // ───────── ナインス ─────────
  {
    slug: "add9",
    title: "アドナインス",
    subtitle: "Cadd9, Cadd2",
    group: "ninth",
    quality: "add9",
    exampleChord: "Cadd9",
    formula: ["R", "3", "5", "9"],
    sound: "メジャーコードに透明感と広がりを足した、キラキラした響き。",
    usage: "アコースティックギターのオープンコード、バラードのイントロ、ロックのアルペジオ。",
    scales: ["ionian", "lydian", "major-pentatonic"],
    tips: {
      guitar: "C・G・D のオープンコードに 9 度を足したフォーム（Cadd9 = x32033 など）はストロークで最も使われる形。7 度を含まないので弾き語りで万能です。",
      bass: "ベースは通常どおりルートと 5 度で OK。9 度はギターやキーボードに任せましょう。",
    },
    glossary: [{ term: "add（アド）", meaning: "7 度を含まずにテンションだけを「追加」する表記。C9 は 7 度を含むので別物。" }],
    body: [
      "add9 はメジャーコードに 9 度（ルートの 1 オクターブ上の 2 度）を加えた和音です。Cadd9 なら C・E・G・D。「add」は 7 度を含まずに付け足す意味で、C9（7 度あり）とは区別されます。",
      "ギターでは、オープンコードに小指で 9 度を足すだけで作れるため、ポップス／ロックのアコースティックな場面で多用されます。",
    ],
    related: ["major", "dominant9", "major9"],
  },
  {
    slug: "dominant9",
    title: "ナインス",
    subtitle: "C9",
    group: "ninth",
    quality: "9",
    exampleChord: "C9",
    formula: ["R", "3", "5", "♭7", "9"],
    sound: "ドミナント 7th にジャジーな彩りを足した、ファンキーで洗練された響き。",
    usage: "ファンクのカッティング、ブルースの Ⅳ7、ジャズのドミナント。",
    scales: ["mixolydian", "lydian-b7", "bebop-dominant"],
    tips: {
      guitar: "5 弦ルートの「x・R・3・♭7・9・5」フォーム（E9 なら x76777）はファンクの代名詞。ルートを省いた 4 弦〜1 弦だけでもカッティングに使えます。",
      bass: "ベースラインは 7th コードと同じ。ルート・5 度・♭7 で OK。",
    },
    body: [
      "9 は 7th コードに 9 度を加えた 5 音の和音です。C9 なら C・E・G・B♭・D。「9」と書かれていれば 7 度（短 7 度）も含むのが約束です。",
      "ファンク／ソウルでは 9th コードのカッティングが定番で、♭7 と 9 の組み合わせがドミナントの緊張感を保ちつつ明るさを加えます。",
    ],
    related: ["dominant7", "dominant13", "dominant7-tensions"],
  },
  {
    slug: "minor9",
    title: "マイナーナインス",
    subtitle: "Cm9",
    group: "ninth",
    quality: "m9",
    exampleChord: "Cm9",
    formula: ["R", "♭3", "5", "♭7", "9"],
    sound: "マイナーセブンスをさらに滑らかにした、都会的でクールな響き。",
    usage: "ネオソウル、R&B、シティポップのⅡm9・Ⅵm9。",
    scales: ["dorian", "aeolian", "minor-pentatonic"],
    tips: {
      guitar: "5 弦ルートの「x・R・♭3・♭7・9・x」または 6 弦ルートで 1 弦に 9 度を足すフォーム。ルートを省略して上 4 弦だけで弾くとコンピング向き。",
      bass: "m7 と同じ。9 度（長 2 度）を経過音に使うと滑らかなラインになります。",
    },
    body: [
      "m9 はマイナーセブンスに 9 度を加えた和音です。Cm9 なら C・E♭・G・B♭・D。9 度が ♭3 の全音上にあるので濁らず、美しく響きます。",
      "ドリアンでもエオリアンでも 9 度は長 2 度なので、m7 で使えるスケールはそのまま使えます（フリジアンの ♭2 だけは合いません）。",
    ],
    related: ["minor7", "dominant9"],
  },
  {
    slug: "major9",
    title: "メジャーナインス",
    subtitle: "Cmaj9, CM9",
    group: "ninth",
    quality: "maj9",
    exampleChord: "Cmaj9",
    formula: ["R", "3", "5", "7", "9"],
    sound: "メジャーセブンスをさらに広げた、夢見るような響き。",
    usage: "バラードのⅠmaj9、シティポップ／ボサノヴァのⅣmaj9。",
    scales: ["ionian", "lydian", "major-pentatonic"],
    tips: {
      guitar: "5 弦ルートの「x・R・3・7・9・x」が実用的。6 弦ルートでは 1 弦の 9 度を小指で足します。",
      bass: "maj7 と同じ。長 7 度とルートの半音関係を活かしたラインが合います。",
    },
    body: [
      "maj9 はメジャーセブンスに 9 度を加えた和音です。Cmaj9 なら C・E・G・B・D。5 度を省略して 4 音で弾くことが多いコードです。",
      "リディアンなら ♯11 も加えられ、さらに浮遊感のある響きになります。",
    ],
    related: ["major7", "add9"],
  },

  // ───────── 11th / 13th ─────────
  {
    slug: "dominant11",
    title: "イレブンス",
    subtitle: "C11, C9sus4",
    group: "extended",
    quality: "11",
    exampleChord: "C11",
    formula: ["R", "3", "5", "♭7", "9", "11"],
    sound: "sus4 に近い、開いた広がりのあるドミナント。",
    usage: "ファンク／ソウルのドミナント、ゴスペル、Ⅴ11 → Ⅰ。",
    scales: ["mixolydian", "dorian"],
    tips: {
      guitar: "3 度と 11 度（4 度）が半音でぶつかるため、実際は 3 度を省いて「9sus4」の形で弾きます。ルート・♭7・9・11 の 4 音が基本。",
      bass: "ルートと ♭7、11 度（4 度）を使うと sus 的な広がりが出ます。3 度は避けましょう。",
    },
    body: [
      "11 は 9th コードにさらに 11 度（4 度）を加えた和音ですが、3 度と 11 度が半音違いで濁るため、ギターでは 3 度を抜いて弾くのが普通です。その場合は 9sus4 と同じ構成音になります。",
      "ファンクやゴスペルで、Ⅴ7 の代わりに柔らかく広がったドミナントとして使われます。",
    ],
    related: ["sus", "dominant9", "dominant13"],
  },
  {
    slug: "dominant13",
    title: "サーティーンス",
    subtitle: "C13",
    group: "extended",
    quality: "13",
    exampleChord: "C13",
    formula: ["R", "3", "5", "♭7", "9", "13"],
    sound: "豊かで華やかなジャズのドミナント。ビッグバンドの最後の一音。",
    usage: "ジャズのⅤ13 → Ⅰ、ブルースの Ⅰ13・Ⅳ13、ファンクのカッティング。",
    scales: ["mixolydian", "lydian-b7", "bebop-dominant"],
    tips: {
      guitar: "6 弦ルートの「R・x・♭7・3・13・x」が定番。5 度と 9 度は省略しても 13th の響きは保てます。",
      bass: "ベースは 7th と同じ。13 度（6 度）をウォーキングの経過音に使えます。",
    },
    glossary: [{ term: "テンション", meaning: "9・11・13 度のように、基本の 4 音の上に積む音。響きに彩りを加える。" }],
    body: [
      "13 は 7th コードに 9 度と 13 度（6 度）を加えた和音です。C13 なら C・E・G・B♭・D・A。6 音あるので、ギターでは 5 度や 9 度を省いて 4〜5 音で弾きます。",
      "13 度はミクソリディアンの長 6 度そのもの。ドミナント上で 13 度を強調するだけで一気にジャズっぽくなります。",
    ],
    related: ["dominant9", "dominant7-tensions"],
  },

  // ───────── ドミナントの役割 ─────────
  {
    slug: "dominant-role",
    title: "ドミナント 7th の役割（トライトーンと解決）",
    group: "dominant",
    exampleChord: "G7",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["Dm7", "G7", "Cmaj7"], caption: "Ⅱ-Ⅴ-Ⅰ。G7 の B（3 度）→ C、F（♭7）→ E へ半音で解決する" },
    formula: ["Ⅴ7 = R", "3", "5", "♭7"],
    sound: "「帰りたい」という引力そのもの。",
    usage: "曲の区切り、サビの直前、エンディング。あらゆる解決の場面。",
    scales: ["mixolydian", "altered", "combination-of-diminished", "phrygian-dominant"],
    tips: {
      guitar: "Ⅴ7 の 3 度と ♭7 を押さえ、それぞれ半音で Ⅰ の R と 3 度へ動かす練習をすると、解決の仕組みが指で理解できます。",
      bass: "Ⅴ → Ⅰ はルートの完全 4 度上行（または 5 度下行）。この動きがベースラインの最も強い推進力です。",
    },
    glossary: [
      { term: "ドミナント", meaning: "キーの 5 番目の音（Ⅴ）の上にできるコード。トニックへ戻ろうとする機能。" },
      { term: "トライトーン", meaning: "3 全音（半音 6 つ）の音程。Ⅴ7 の 3 度と ♭7 の間にあり、強い不安定さを作る。" },
      { term: "解決", meaning: "不安定な音や和音が安定した音や和音へ進むこと。" },
    ],
    body: [
      "ドミナント 7th（Ⅴ7）の中には、キーの 7 番目の音（導音）と 4 番目の音が含まれています。C メジャーの G7 なら B と F。この 2 音の間がトライトーンで、B は半音上の C へ、F は半音下の E へ進みたがります。これが「ドミナントがトニックへ解決する」正体です。",
      "この仕組みが分かると、セカンダリードミナント（ほかのコードへ向かう一時的な Ⅴ7）や裏コード（同じトライトーンを持つ別のコード）も同じ理屈で理解できます。",
      "スケールの選び方: 明るく解決するならミクソリディアン、緊張感を最大化するならオルタード、マイナーに解決するなら HmP5↓。解決直前の「ぶつかり」が大きいほど、解決したときの気持ちよさも大きくなります。",
    ],
    related: ["dominant7", "tritone-substitution", "dominant7-tensions", "function"],
  },
  {
    slug: "tritone-substitution",
    title: "裏コード（トライトーン・サブスティテューション）",
    group: "dominant",
    exampleChord: "Db7",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["Dm7", "Db7", "Cmaj7"], caption: "G7 を D♭7 に置き換えた Ⅱ-♭Ⅱ7-Ⅰ。ベースが半音で下降する" },
    formula: ["♭Ⅱ7 = R", "3", "5", "♭7"],
    sound: "Ⅴ7 より洗練され、半音で滑り落ちるようなおしゃれな解決。",
    usage: "ジャズのⅡ-Ⅴ-Ⅰ、ボサノヴァ、エンディングのターンアラウンド。",
    scales: ["lydian-b7", "combination-of-diminished", "whole-tone"],
    tips: {
      guitar: "G7 と D♭7 は 3 度と ♭7 が入れ替わっただけ（B・F ⇄ F・C♭）。同じフォームを 6 フレット離れた位置で弾くと、構成音の共通点が指板で見えます。",
      bass: "Ⅱ → ♭Ⅱ → Ⅰ とルートが半音ずつ下がるので、ベースラインがとても滑らかになります。裏コードはベーシストにとって最もおいしい置き換えです。",
    },
    glossary: [{ term: "代理コード", meaning: "元のコードと共通の音や機能を持ち、入れ替えて使えるコード。" }],
    body: [
      "裏コードは、Ⅴ7 をトライトーン（半音 6 つ）離れたルートの 7th コードに置き換える技法です。C メジャーの G7（G・B・D・F）に対し、D♭7（D♭・F・A♭・C♭）。3 度と ♭7 の 2 音（B＝C♭ と F）が共通なので、同じ「解決したい力」を持ちながらベースが半音で下降します。",
      "ローマ数字では ♭Ⅱ7。Ⅱm7 → ♭Ⅱ7 → Ⅰmaj7 と並ぶと、ルートが D → D♭ → C と半音階で下りていきます。",
      "スケールは裏コードのリディアン♭7 が定番。これは元の Ⅴ7 のオルタードスケールと同じ構成音なので、どちらの視点でも同じフレーズが使えます。",
    ],
    related: ["dominant-role", "dominant7", "substitute-chords"],
  },
  {
    slug: "dominant7-tensions",
    title: "テンションとオルタードテンション",
    subtitle: "7(♭9), 7(♯9), 7(♯11), 7(♭13), 7alt",
    group: "dominant",
    exampleChord: "G7alt",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["Dm7", "G7alt", "Cmaj7"], caption: "Ⅴ7 にオルタードテンションを乗せた Ⅱ-Ⅴ-Ⅰ" },
    formula: ["R", "3", "♭7", "+ ♭9 / ♯9 / ♯11 / ♭13"],
    sound: "ヒリヒリした緊張感。解決したときの開放感が格段に増します。",
    usage: "ジャズ／フュージョンのⅤ7、マイナーへ解決するドミナント、ロックの「ジミヘン・コード（7♯9）」。",
    scales: ["altered", "combination-of-diminished", "phrygian-dominant", "whole-tone", "lydian-b7"],
    tips: {
      guitar: "7♯9 は E7♯9（0・x・0・1・x・3 など）のロックの定番。ジャズでは 5 弦ルートの R・3・♭7・♭9／♯9 フォームを覚えると、テンションだけ指 1 本で切り替えられます。",
      bass: "テンションはベースで鳴らすと濁りやすいので、ルートと ♭7 を軸に、♭9 や ♭13 は上の楽器に任せるのが基本。ソロでは思い切り使って OK。",
    },
    glossary: [
      { term: "ナチュラルテンション", meaning: "9・11・13 など、スケール上にそのままある（変化していない）テンション。" },
      { term: "オルタードテンション", meaning: "♭9・♯9・♯11・♭13 のように半音変化させたテンション。「alt」は「変化させた」の意味。" },
    ],
    body: [
      "7th コードの上に積む 9・11・13 度を「テンション」と呼びます。それらを半音上げ下げしたものが「オルタードテンション」（♭9・♯9・♯11・♭13）で、ドミナントの緊張感をさらに高めます。",
      "表記の読み方: G7(♭9) は G7 に ♭9（A♭）を加える、G7(♯9) は ♯9（A♯）、G7alt は「好きなオルタードテンションを使ってよい」という指示です。",
      "スケールとの対応: ♭9・♯9・♯11・♭13 をすべて含むのがオルタードスケール。♭9・♯9・♯11 に ♮5・13 を加えたものがコンビネーション・オブ・ディミニッシュ。♭9・♭13 だけなら HmP5↓。♯11・♭13 ならホールトーン、♯11 だけならリディアン♭7。コード表記を見れば、どのスケールを選べばよいかが分かります。",
    ],
    related: ["dominant7", "dominant-role", "tritone-substitution"],
  },

  // ───────── 理論 ─────────
  {
    slug: "diatonic",
    title: "ダイアトニックコードの仕組み（メジャー／マイナー）",
    group: "theory",
    exampleChord: "Cmaj7",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7b5"], caption: "C メジャーのダイアトニック 7th コード" },
    formula: ["Ⅰmaj7", "Ⅱm7", "Ⅲm7", "Ⅳmaj7", "Ⅴ7", "Ⅵm7", "Ⅶm7♭5"],
    sound: "キーのスケールだけで作られる「家族」のようなコード群。",
    usage: "曲のほとんどはダイアトニックコードでできています。ローマ数字で覚えれば全キーに応用可能。",
    scales: ["ionian", "aeolian", "harmonic-minor"],
    tips: {
      guitar: "C メジャーのダイアトニック 7th を 6 弦ルートと 5 弦ルートのフォームで一気に弾く練習は、指板の理解に最も効きます。",
      bass: "各コードのルートをスケール順に弾きながら「Ⅰ・Ⅱm・Ⅲm…」と口に出すと、度数の感覚が身につきます。",
    },
    glossary: [
      { term: "ダイアトニック", meaning: "「その調の音階に属する」という意味。スケールの音だけで作られたコード。" },
      { term: "ローマ数字表記", meaning: "キーのスケールの何番目の音をルートにするかを Ⅰ〜Ⅶ で表す。キーが変わっても同じ表記で通じる。" },
    ],
    body: [
      "メジャースケールの各音の上に、スケール内の音だけを 1 つおきに積むと 7 つのコードができます。これがダイアトニックコードです。C メジャーなら C・Dm・Em・F・G・Am・Bdim（三和音）、Cmaj7・Dm7・Em7・Fmaj7・G7・Am7・Bm7♭5（四和音）。",
      "並び方はどのキーでも同じで、Ⅰmaj7・Ⅱm7・Ⅲm7・Ⅳmaj7・Ⅴ7・Ⅵm7・Ⅶm7♭5。ローマ数字で覚えておけば、キーが変わってもすぐ対応できます。",
      "マイナーキー（ナチュラルマイナー）では Ⅰm7・Ⅱm7♭5・♭Ⅲmaj7・Ⅳm7・Ⅴm7・♭Ⅵmaj7・♭Ⅶ7。ただし実際の曲では、ドミナントを強めるために Ⅴ をハーモニックマイナー由来の Ⅴ7（A マイナーなら E7）にすることがほとんどです。",
      "スケール提案ツールは、入力したコードがダイアトニックかどうかを自動で判定し、ダイアトニックなら「キーの構成音をそのコードのルートから並べたモード」（Ⅱm7 ならドリアンなど）を第一候補にします。",
    ],
    related: ["function", "substitute-chords", "major7"],
  },
  {
    slug: "function",
    title: "コードの機能（トニック・サブドミナント・ドミナント）",
    group: "theory",
    exampleChord: "G7",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["C", "F", "G7", "C"], caption: "T → SD → D → T の基本形（Ⅰ-Ⅳ-Ⅴ-Ⅰ）" },
    formula: ["T = Ⅰ・Ⅲm・Ⅵm", "SD = Ⅱm・Ⅳ", "D = Ⅴ・Ⅶdim"],
    sound: "安定（T）→ 少し動く（SD）→ 緊張（D）→ 安定（T）という物語。",
    usage: "進行の分析、作曲、アドリブで「今どこにいるか」を把握するために。",
    scales: ["ionian"],
    tips: {
      guitar: "ソロでは T の上では落ち着いたコードトーン、D の上ではテンションやクロマチックを使うなど、機能に合わせてフレーズの「緊張度」を変えると音楽的になります。",
      bass: "D → T の動き（Ⅴ → Ⅰ）でルートを完全 4 度上に進むのがベースの決め所。SD では Ⅳ のルートで安定させ、D で動きを作りましょう。",
    },
    glossary: [
      { term: "トニック（T）", meaning: "最も安定した「家」のコード。Ⅰ とその代理（Ⅲm・Ⅵm）。" },
      { term: "サブドミナント（SD）", meaning: "家から少し出かけるコード。Ⅳ とその代理（Ⅱm）。" },
      { term: "ドミナント（D）", meaning: "家へ帰りたくなる緊張のコード。Ⅴ とその代理（Ⅶdim）。" },
    ],
    body: [
      "ダイアトニックコードは、響きの役割によって 3 つの機能に分けられます。トニック（安定）、サブドミナント（やや不安定・展開）、ドミナント（不安定・解決を求める）です。",
      "C メジャーでは、T = C・Em・Am、SD = Dm・F、D = G・Bdim。同じ機能のコードは入れ替えて使える（代理コード）ので、Ⅰ → Ⅳ → Ⅴ を Ⅵm → Ⅱm → Ⅴ に置き換えるといった工夫ができます。",
      "マイナーキーでは、T = Ⅰm・♭Ⅲ、SD = Ⅱm7♭5・Ⅳm・♭Ⅵ、D = Ⅴ（7）・♭Ⅶ。Ⅳm や ♭Ⅵ はメジャーキーに借用すると「サブドミナントマイナー」として、切ない響きを加えます。",
    ],
    related: ["diatonic", "substitute-chords", "dominant-role"],
  },
  {
    slug: "substitute-chords",
    title: "代理コードと借用和音",
    group: "theory",
    exampleChord: "Fm7",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["Cmaj7", "Fm7", "Bb7", "Cmaj7"], caption: "Ⅳ を同主調マイナーの Ⅳm7 に、Ⅴ7 を ♭Ⅶ7 に置き換えた例" },
    formula: ["Ⅰ ≒ Ⅲm ≒ Ⅵm", "Ⅳ ≒ Ⅱm ≒ Ⅳm", "Ⅴ7 ≒ Ⅶdim ≒ ♭Ⅱ7 ≒ ♭Ⅶ7"],
    sound: "同じ役割のまま、色だけを変える。",
    usage: "リハーモナイズ（コードの付け替え）、アレンジ、マンネリ打破。",
    scales: ["dorian", "lydian", "mixolydian"],
    tips: {
      guitar: "Ⅳ → Ⅳm（F → Fm）のように、1 音だけ動かす置き換えから試すと効果が分かりやすいです。",
      bass: "代理コードに変えてもベースのルートは変わります。ギターが Ⅵm を弾いているのに Ⅰ のルートを弾くと C/A のような別の響きになるので、譜面をよく確認しましょう。",
    },
    glossary: [
      { term: "代理コード", meaning: "同じ機能を持ち、入れ替えて使えるコード。共通音が多いほど自然に置き換えられる。" },
      { term: "借用和音（モーダルインターチェンジ）", meaning: "同主調（同じルートの別のモード）からコードを一時的に借りてくること。" },
    ],
    body: [
      "代理コードとは、元のコードと同じ機能（T・SD・D）を持ち、構成音も多く共有するコードのことです。C メジャーなら、Ⅰ（C）の代わりに Ⅲm（Em）や Ⅵm（Am）、Ⅳ（F）の代わりに Ⅱm（Dm）、Ⅴ7（G7）の代わりに Ⅶm7♭5（Bm7♭5）や裏コードの ♭Ⅱ7（D♭7）。",
      "借用和音は、同主調（C メジャーに対する C マイナー）のダイアトニックコードを借りてくる技法です。Ⅳm（Fm）、♭Ⅵ（A♭）、♭Ⅶ（B♭）、Ⅱm7♭5（Dm7♭5）などがよく使われ、サブドミナントマイナーと呼ばれる切ない響きになります。",
      "スケール提案ツールでは、借用和音と判定されたコードには「借用元のスケールをそのコードのルートから並べたモード」を提案します。Ⅳm7 ならドリアン、♭Ⅶ7 ならミクソリディアンです。",
    ],
    related: ["function", "tritone-substitution", "diatonic"],
  },

  // ───────── 転回形 ─────────
  {
    slug: "inversions",
    title: "転回形とスラッシュコード",
    subtitle: "C/E, C/G, G/B, Am7/G",
    group: "inversion",
    exampleChord: "C/E",
    exampleProgression: { key: { tonic: "C", mode: "major" }, chords: ["C", "G/B", "Am", "C/G", "F", "C/E", "Dm7", "G7"], caption: "転回形でベースを段階的に下降させるカノン風の進行" },
    formula: ["基本形 = R が最低音", "第 1 転回形 = 3 度が最低音", "第 2 転回形 = 5 度が最低音"],
    sound: "コードは同じなのに、ベースが変わると表情が変わる。",
    usage: "ベースラインを滑らかに動かす、ペダルポイント、分数コードでの浮遊感。",
    scales: ["ionian"],
    tips: {
      guitar: "C/E は C のオープンコードの 6 弦 E を鳴らすだけ、C/G は 6 弦 3 フレットを押さえるだけ。「上のコードは変えずに低音だけ変える」感覚を持ちましょう。",
      bass: "スラッシュコードはベーシストへの指示そのもの。C/E なら E を弾きます。上に書かれたコード（C）の音でフィルを入れてよいですが、小節頭は指定されたベース音を確実に。",
    },
    glossary: [
      { term: "転回形", meaning: "コードの構成音の並び替えで、ルート以外を最低音にしたもの。" },
      { term: "スラッシュコード（分数コード）", meaning: "「C/E」のように、スラッシュの右にベース音を指定する表記。日本では分数コードとも呼ぶ。" },
      { term: "ペダルポイント", meaning: "上のコードが変わっても、ベースが同じ音を鳴らし続けること。" },
    ],
    body: [
      "転回形は、コードの構成音のうちルート以外を一番下（ベース）に置いた形です。C（C・E・G）なら、E が最低音の C/E（第 1 転回形）、G が最低音の C/G（第 2 転回形）。構成音は同じなので役割は変わりませんが、ベースの動きが滑らかになります。",
      "スラッシュコードの右側が構成音でない場合（例: G/A、F/G）は転回形ではなく、ベースを固定したまま上のコードを変える「分数コード」です。F/G は G7sus4 に近い響きで、ドミナントの代わりによく使われます。",
      "スケールの選び方は上のコードと同じ。C/E なら C メジャーコードとして扱い、ベース音の E はコードトーンなので何も変わりません。ベース音が構成音でないときは、ベース音も含めて「鳴っている音」として指板上で確認しましょう。スケール提案ツールは、スラッシュコードの種類（転回形か分数コードか）を自動で説明します。",
    ],
    related: ["major", "function"],
  },
];

export const DOC_BY_SLUG: Record<string, ChordDoc> = Object.fromEntries(CHORD_DOCS.map((d) => [d.slug, d]));
