# Grammar Train

英語の前置詞・冠詞・可算/不可算名詞を穴埋めタイピングで練習する PWA（Vite + React + TypeScript）。

## 環境

Node.js はこのマシンに標準では入っておらず `~/.local` に手動インストールしてある。
非ログインシェルでは PATH が通っていないことがあるので、コマンドの前に付ける:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## 開発の進め方

- **テスト先行（TDD）**。ロジックもコンポーネントも、テストを書いてから実装する
- 変更したら `npm test` / `npm run typecheck` / `npm run build` を通す（CI でも push ごとに実行）
- ロジックは `src/lib/` の純粋関数に切り出し、UI から日付計算や判定を追い出す

## ステージを追加するときの注意点

1. `src/data/stages/` に JSON を置く
2. `src/data/index.ts` の `stageSources` に import を 1 行足す（**配列の位置はどこでもよい**）
3. `npm test`

**`id` は絶対に変えない。** `id` は localStorage に保存する記録（`grammar-train:records:v1`）の
主キー。リネームすると前回の正答率が中身の違うステージに付いたり消えたりする。
公開済みの id は `src/data/index.test.ts` の `PUBLISHED_IDS` で固定してあり、
リネーム・削除するとテストが落ちる。

**順番は `order` で決める。** 小さいほど先に表示される。既存は 10 刻み（10, 20, 30, 40, 50, 60）
なので、間に挿したいときは `15` のような中間値を使う。
順番が `order` で決まるので、**`id` に連番を含める必要はない**（例: `prepositions-advanced-time`）。

その他のルール:

- `category` は `preposition` / `article` / `noun`
- 問題数は 1 問以上（標準は 30 問。短い腕試しステージも作れる）
- 空欄は `___`（アンダースコア 3 つ）。無冠詞の問題は `answer: ""`
- `translation` は解答前から表示される
- `explanation` は「月には in」のようなルール暗記ではなく、**なぜその語なのかがネイティブの
  イメージで分かる説明**を書く（例: 「in のイメージは『囲まれた中』。10 月という 31 日分の
  箱の中に誕生日が入っている」）。データ検証テストが長さ 20 文字以上をガードしている

### 不備があったときの挙動

- **本番（ブラウザ）**: `loadStages()` が壊れたステージだけ `console.error` して除外し、
  残りは遊べる。1 個のタイポでアプリ全体が白画面になるのを避けるため
- **テスト / CI**: 厳格版 `validateStages()` が `stageSources` を検証するので不備は必ず落ちる

## 永続データ

| キー | 中身 |
|---|---|
| `grammar-train:records:v1` | ステージごとの直近の成績。キーは `stage.id` |
| `grammar-train:history:v1` | 日ごとのクリア数（`{ "2026-07-25": 3 }`）。キーは**ローカル日付** |

- 日付キーに `toISOString()` を使わないこと。UTC になり日本時間の朝 9 時前が前日扱いになる。
  `src/lib/history.ts` の `toDateKey()` を使う
- `records` は `stage.id` キー、`history` はステージ非依存なので、**ステージの追加・並べ替えで
  記録は壊れない**
- 削除・リネームした id の孤児レコードは**あえて掃除しない**。掃除すると「ステージを一時的に
  外したら記録が消える」事故が起きるため
- 形式を変えたくなったらキーの `:v1` を上げて新設し、旧バージョンから移行する
