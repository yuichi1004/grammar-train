# Grammar Train

英語の前置詞・冠詞・可算/不可算名詞を穴埋めタイピングで練習する PWA です。

- 1 ステージ 30 問。入力すると即座に正誤フィードバック（不正解時は正解・和訳・解説を表示）
- ステージ完了後に正答率を表示し、ステージ選択画面に前回の正答率を表示
- 記録はブラウザの localStorage に保存（完全ローカル動作）
- PWA としてインストール可能・オフライン動作対応

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm test           # テスト（vitest run）
npm run test:watch # テスト（watch モード）
npm run typecheck  # 型チェック
npm run build      # 本番ビルド（PWA / Service Worker 生成込み）
npm run preview    # 本番ビルドの確認
```

変更のたびに `npm test` が通ることを確認してください（CI でも push ごとに typecheck / test / build を実行します）。

## ステージの追加方法

1. `src/data/stages/` に JSON ファイルを追加する

```json
{
  "id": "prepositions-3",
  "title": "前置詞 応用 1",
  "category": "preposition",
  "description": "ステージの説明",
  "questions": [
    {
      "sentence": "I arrived ___ the station.",
      "answer": "at",
      "accept": [],
      "translation": "駅に着いた。",
      "explanation": "地点には at。"
    }
  ]
}
```

2. `src/data/index.ts` に import を 1 行追加して配列に足す

ルール:

- `category` は `preposition` / `article` / `noun` のいずれか
- 問題数はちょうど 30 問
- 空欄は `___`（アンダースコア 3 つ）
- `answer` が正解。別解があれば `accept` に列挙
- 無冠詞の問題は `answer: ""`（プレイヤーは空欄のまま解答する）

形式は `npm test` のデータ検証テストが自動でチェックします。

## アイコンの再生成

`public/favicon.svg` を変更したら:

```bash
node scripts/generate-icons.mjs
```

## デプロイ（Vercel）

リポジトリを Vercel に接続するだけです（フレームワーク: Vite が自動検出されます）。
ビルドコマンド `npm run build`、出力ディレクトリ `dist`。
