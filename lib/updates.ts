export const updates = [
  {
    version: '1.0.0',
    description: ['初版リリース'],
    date: '2024-11-04',
  },
  {
    version: '1.1.0',
    description: ['レイアウト変更', '代替品バーコードの追加'],
    date: '2025-01-05',
  },
  {
    version: '1.2.0',
    description: [
      '欠品代替が存在しないエクセルファイルをアップロードした際のエラーメッセージを修正',
      'Next.jsのロゴが表示されない問題を修正',
      '更新履歴のダイアログを追加',
    ],
    date: '2025-05-24',
  },
]

export type UpdateItem = {
  version: string;
  description: string[];
  date: string;
};
