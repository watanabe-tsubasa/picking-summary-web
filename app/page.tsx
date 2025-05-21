import FileHandler from "@/components/FileHandler";
import { UpdateDialog } from "@/components/UpdateDialog";
import { updates } from "@/lib/updates";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col gap-4 items-end justify-center row-start-1 w-full sm:w-[600px] max-w-[600px]">
        <UpdateDialog updates={updates} />
      </header>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start sm:w-[600px] max-w-[600px]">
        <h1 className="text-4xl font-bold">
          ピッキング履歴まとめ
        </h1>
        <div className="flex flex-row items-center">
          <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
            <li className="mb-2">
              ASPBから出力した
              <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
                XLSXファイル
              </code>
              を
              {" "}
              <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
                ドラッグ&ドロップ領域
              </code>

              からアップロード
            </li>
            <li>
              <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
                ファイル出力
              </code>
              ボタンを押してファイルを生成
            </li>
          </ol>
        </div>
        <FileHandler />

      </main>
      <footer className="row-start-3 flex gap-6 flex-col items-center justify-center">
      <div className="flex gap-x-4 items-end">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <p className="text-2xl">and</p>
          <Image
            className="dark:invert"
            src="/googlecloud.png"
            alt="cloudrun logo"
            width={170}
            height={38}
          />
        </div>
        <div>
          <p>made in 2024</p>
        </div>
      </footer>
    </div>
  );
}
