# Grammar Train

英語の前置詞・冠詞・可算/不可算名詞を穴埋めタイピングで練習する PWA です。

- 1 ステージ 30 問。和訳は解答前から表示され、入力すると即座に正誤フィードバック（正解・不正解どちらでも解説を表示）
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
      "explanation": "at のイメージは「点」。駅を地図にピンを刺せる一地点として捉えているので at。"
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
- `translation` は解答前から表示される（前置詞・冠詞を選ぶ問題なので訳が見えていても答えは絞れない）
- `explanation` は「どの語を使うか」のルール暗記ではなく、**なぜその語なのかがイメージで分かる説明**を書く
  - 例: 「in のイメージは『囲まれた中』。10 月という 31 日分の箱の中に誕生日が入っている」
  - 一言ルール（「月には in」）に戻っていないか、データ検証テストが長さで最低限チェックする

形式は `npm test` のデータ検証テストが自動でチェックします。

## アイコンの再生成

`public/favicon.svg` を変更したら:

```bash
node scripts/generate-icons.mjs
```

## デプロイ（Vercel）

リポジトリを Vercel に接続するだけです（フレームワーク: Vite が自動検出されます）。
ビルドコマンド `npm run build`、出力ディレクトリ `dist`。
