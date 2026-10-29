import type { Metadata } from "next";
import { AudioAnalyzer } from "@/components/analyze/AudioAnalyzer";

export const metadata: Metadata = {
  title: "音源解析",
  description: "音声ファイルからキー・テンポ・コード進行をブラウザ内で推定し、スケール提案ツールに送れます。ファイルはどこにも送信されません。",
  alternates: { canonical: "/analyze" },
};

export default function AnalyzePage() {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">音源解析（ベータ）</h1>
        <p className="text-sm text-muted-foreground">
          音声ファイルからキー・テンポ・コード進行を推定します。推定したコード進行は編集してから「スケール提案ツールで開く」で、各コードに合うスケールと指板を確認できます。
        </p>
        <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
          <li>処理はブラウザ内で完結します（ファイルはアップロードされません）。</li>
          <li>精度の目安: キーは高い確率で当たります。コードは弾き語りやシンプルなポップスで 6〜7 割程度、歪んだギターや密なミックス、複雑なジャズでは落ちます。</li>
          <li>検出できるコードはメジャー／マイナー／7／maj7／m7 です。テンションや転回形は、結果を手で直してください。</li>
          <li>テンポは一定と仮定しています。テンポが揺れる曲では区切りがずれることがあります。</li>
        </ul>
      </section>
      <AudioAnalyzer />
    </div>
  );
}
