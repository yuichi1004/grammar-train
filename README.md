# Grammar Train

英語の前置詞・冠詞・可算/不可算名詞・時制を穴埋めタイピングで練習する PWA です。

- 1 ステージ 30 問。和訳は解答前から表示され、入力すると即座に正誤フィードバック（正解・不正解どちらでも解説を表示）
- ステージは 5 カテゴリ（前置詞 / 冠詞 / 名詞 / 時制 / 場面別）に分かれ、選択画面でグループ表示
- ステージ完了後に正答率を表示し、ステージ選択画面に前回の正答率を表示
- 学習記録: 日ごとにクリアしたステージ数を月間カレンダーのヒートマップで振り返り
- 記録はブラウザの localStorage に保存（完全ローカル動作）
- PWA としてインストール可能・オフライン動作対応

## localStorage のキー

| キー | 中身 |
|---|---|
| `grammar-train:records:v1` | ステージごとの直近の成績（`{ [stageId]: { correct, total, accuracy, playedAt } }`） |
| `grammar-train:history:v1` | 日ごとのクリア数（`{ "2026-07-25": 3 }`。キーは**ローカル日付**） |

日付キーに `toISOString()` を使うと UTC になり日本時間の朝 9 時前が前日扱いになるため、
`src/lib/history.ts` の `toDateKey()` でローカル日付に切っています。

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
  "id": "prepositions-advanced-time",
  "order": 15,
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

2. `src/data/index.ts` の `stageSources` に import を 1 行追加して配列に足す
   （配列に足す位置は問わない。表示順は `order` で決まる）

ルール:

- **`id` は絶対に変えない**。localStorage に保存する記録の主キーなので、リネームすると
  前回の正答率が別ステージに付いたり消えたりする。公開済みの id は
  `src/data/index.test.ts` の `PUBLISHED_IDS` で固定してあり、リネーム・削除するとテストが落ちる
- `order` が表示順（小さいほど先）。**カテゴリごとにブロックを割り当てている**:
  前置詞 100 番台 / 冠詞 200 番台 / 名詞 300 番台 / 時制 400 番台 / 場面 500 番台。
  ブロック内は 10 刻みなので、間に挿したいときは `115` のような中間の値を使う。
  **id に連番を入れる必要はない**
- `category` は `preposition` / `article` / `noun` / `tense` / `scene` のいずれか。
  追加するときは `types.ts` の `StageCategory`、`lib/stages.ts` の `CATEGORIES`、
  `StageSelect.tsx` の `CATEGORY_LABELS` の 3 か所（漏れは typecheck で落ちる）
- 問題数は 1 問以上（標準は 30 問。「10 問の腕試し」のような短いステージも作れる）
- 空欄は `___`（アンダースコア 3 つ）
- `answer` が正解。別解があれば `accept` に列挙
- 何も入らない問題は `answer: ""`（無冠詞、`discuss` のように前置詞を付けない場合）。
  プレイヤーは空欄のまま解答し、Quiz が自動でその旨のヒントを出す
- `hint`（任意）は入力のしかたの注意。時制ステージの「括弧内の語を文に合う形にして入力」など
- `translation` は解答前から表示される（前置詞・冠詞を選ぶ問題なので訳が見えていても答えは絞れない）
- `explanation` は「どの語を使うか」のルール暗記ではなく、**なぜその語なのかがイメージで分かる説明**を書く
  - 例: 「in のイメージは『囲まれた中』。10 月という 31 日分の箱の中に誕生日が入っている」
  - 一言ルール（「月には in」）に戻っていないか、データ検証テストが長さで最低限チェックする

### 答えが一意に定まる問題にする

穴埋めは正解が 1 つに決まらないと、正しく考えた人を不正解にしてしまいます
（`I ___ here for five years. (live)` は `have lived` も `have been living` も自然）。
時制の出題では、助動詞だけを空欄にする・括弧の cue で語形を固定する・空欄の前に文脈文を置く・
状態動詞を選んで完了進行形を排除する、といった手を使って一意にします。
詳しい技法と「出題してはいけない対立」の一覧は `CLAUDE.md` にあります。

また `'` を含む答えには `’`（U+2019）版を必ず `accept` に入れてください
（判定は句読点を正規化しないため、iOS のスマート引用符で正答が不正解になります）。

形式は `npm test` のデータ検証テストが自動でチェックします
（アポストロフィの別解、答えの語数、accept の重複も含む）。

### 不備があったときの挙動

- **本番（ブラウザ）**: 壊れたステージだけ `console.error` を出して除外し、残りのステージは遊べる。
  1 個のタイポでアプリ全体が白画面になるのを避けるため（`loadStages`）
- **テスト / CI**: 厳格版（`validateStages`）で全 JSON を検証するので、不備は必ず落ちる

### 学習記録との互換性

ステージの追加・並べ替えで記録が壊れないようになっています。

- `history` は「日付 → クリア数」だけでステージを参照しないため影響を受けない
- `records` は `stage.id` をキーにするため、並べ替えても記録は正しいステージに付いたまま
- 削除・リネームした id の記録は localStorage に残るが、あえて掃除していない
  （掃除すると「ステージを一時的に外したら記録が消える」事故が起きるため）

## アイコンの再生成

`public/favicon.svg` を変更したら:

```bash
node scripts/generate-icons.mjs
```

## デプロイ（Vercel）

リポジトリを Vercel に接続するだけです（フレームワーク: Vite が自動検出されます）。
ビルドコマンド `npm run build`、出力ディレクトリ `dist`。
