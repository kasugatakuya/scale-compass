import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="text-sm text-muted-foreground">URL が間違っているか、ページが移動した可能性があります。</p>
      <Link href="/" className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
        スケール提案ツールへ戻る
      </Link>
    </div>
  );
}
