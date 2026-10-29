import type { Metadata } from "next";
import { ProgressionList } from "@/components/progressions/ProgressionList";

export const metadata: Metadata = {
  title: "コード進行集",
  description: "王道進行、カノン進行、小室進行、Ⅱ-Ⅴ-Ⅰ、12 小節ブルースなど、よく使われるコード進行をカテゴリ別に解説。キー指定込みでスケール提案ツールに送れます。",
};

export default function ProgressionsPage() {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">コード進行集</h1>
        <p className="text-sm text-muted-foreground">
          よく使われるコード進行を、雰囲気・ジャンル・難易度から探せます。「スケール提案ツールで開く」を押すと、キー指定込みでツールに読み込まれ、各コードで使えるスケールと指板を確認できます。
        </p>
      </section>
      <ProgressionList />
    </div>
  );
}
