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

**順番は `order` で決める。** 小さいほど先に表示される。**カテゴリごとにブロックを割り当てている**:

| カテゴリ | order | 選択画面の見出し |
|---|---|---|
| `preposition` | 100 番台 | 前置詞 |
| `article` | 200 番台 | 冠詞 |
| `noun` | 300 番台 | 名詞 |
| `tense` | 400 番台 | 時制 |
| `scene` | 500 番台 | 場面（ビジネスなど。前置詞・冠詞・時制を横断する） |

ブロック内は 10 刻み（110, 120, …）。間に挿したいときは `115` のような中間値を使う。
順番が `order` で決まるので、**`id` に連番を含める必要はない**（例: `prepositions-abstract`）。

選択画面は `StageSelect.tsx` の `CATEGORY_ORDER` の順にカテゴリ見出しでグループ化する。
グループ内の並びは `order` 昇順で、`order` の値そのものには依存しない。

その他のルール:

- `category` は `preposition` / `article` / `noun` / `tense` / `scene`。
  **追加するときは 3 か所**（`types.ts` の `StageCategory` / `lib/stages.ts` の `CATEGORIES` /
  `StageSelect.tsx` の `CATEGORY_LABELS`）。`CATEGORY_LABELS` は `Record<StageCategory, string>`
  なので漏れは typecheck で落ちる
- 問題数は 1 問以上（標準は 30 問。短い腕試しステージも作れる）
- 空欄は `___`（アンダースコア 3 つ）
- **何も入らない問題は `answer: ""`**（無冠詞、`discuss about` のように前置詞を付けない場合）。
  空欄の答えを含むステージには Quiz が自動でヒントを出す（カテゴリではなくデータから判定する）。
  ただし `article` / `scene` 以外のカテゴリで空の答えはバグ扱いでテストが落ちる
- `hint`（任意）は入力のしかたの注意を解答前に表示する。答えを示唆する内容は書かない
- `translation` は解答前から表示される
- `explanation` は「月には in」のようなルール暗記ではなく、**なぜその語なのかがネイティブの
  イメージで分かる説明**を書く（例: 「in のイメージは『囲まれた中』。10 月という 31 日分の
  箱の中に誕生日が入っている」）。データ検証テストが長さ 20 文字以上をガードしている

### 答えが一意に定まらない問題を作らないこと

穴埋めは**正解が 1 つに決まらないと、正しく考えた人を不正解にする**。時制で特に深刻:

> `I ___ here for five years. (live)` → `have lived` も `have been living` も自然。
> この問題は何も測っていない。

一意にするための技法:

1. **助動詞だけを空欄にする**（最強）。`I ___ just finished the report, so I can help you now. (have)`
   → `have`。後続の `can help` が今との接点を作る。副詞の語順を答えに混ぜずに済む
2. **括弧の cue で語形を固定**。形は 4 種類に統一: `(live)` 原形 / `(not finish)` 否定 /
   `(be going to)` `(must go)` 枠＋原形 / `(always complain)` 副詞込み。
   括弧がない問題は「英文に印字された動詞の助動詞を答える」合図
3. **空欄の前に文脈文を置く**（`sentence` は 1 文でなくてよい。空欄は 1 つだけ）。
   `Look at my hands. I ___ the fence all afternoon. (paint)`
4. **動詞のアスペクトで絞る**。`since` ＋ **状態動詞**（know / be / own / belong）なら完了進行形が
   立たない。**`live` / `work` / `study` は両方立つので継続の出題に使わない**
5. **もう一方の節に時制を印字して相互固定**。`If you ___ me earlier, I could have changed the booking.`
6. **`accept` は等価な変異形専用**。`were`/`was`、`'ll call`/`will call`。
   **テストしたい対立の相手方を入れない**（`have sent` の問題に `sent` を入れたら何も測れない）

出題してはいけない対立（両方が標準英語）:

| 危険な対立 | 回避策 |
|---|---|
| 現在完了 ↔ 過去形（already / just / yet） | 米語は `I already sent it` が標準。**助動詞だけを空欄**にする |
| 現在完了 ↔ 完了進行形（for ＋ 動作動詞） | 状態動詞に替えるか「今の痕跡」の文脈にする |
| 過去完了 ↔ 過去形（after / before / as soon as） | `by the time` / `already … when` / 順序が語彙で決まる文だけを使う |
| will ↔ be going to（予測） | will はその場の決定・約束・申し出に限定 |
| be going to ↔ 現在進行形（予定） | 予定は現在進行形だけ。`I ___ seeing the dentist at three. (be)` |
| used to ↔ would ↔ 過去形 | 連鎖全体を空欄にしない。`There ___ be …` → `used to` |
| have got / shall（`Shall I …?` 以外） | 使わない |

逆に**最も安全で日本語話者に効く**のは、状態動詞の進行形不可（`I am knowing` は非文）、
時の副詞節の現在形（`when it will rain` は非文）、受動態、仮定法・wish。積極的に出題する。

### 執筆の機械的ルール（テストがガードする）

- **`'` を含む答えには `’`（U+2019）版を `accept` に必ず入れる**。`judge` は句読点を正規化しないので、
  iOS のスマート引用符で正答が不正解になる。`do not` 形も併記する
- **`answer` は 4 語以内**（`will have been working` が上限）
- **副詞は空欄の外に印字する**（語順の当てっこを混ぜない）
- `accept` に `answer` と同じ文字列や重複を入れない
- 不正解時に表示されるのは `answer` だけなので、`accept` の変異形は解説の中で触れる

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

## PWA の更新（iOS のホーム画面アプリ）

iOS のホーム画面に追加した PWA は、Safari のタブと違ってバックグラウンド復帰や再訪問だけでは
Service Worker の更新チェックが走らないことがある。そのため:

- `vite.config.ts` の `VitePWA` は `injectRegister: false` にしてあり、`registerType: 'autoUpdate'`
  の自動注入スクリプトは使わない。代わりに `src/main.tsx` で `virtual:pwa-register` の
  `registerSW()` を直接呼び、登録した `ServiceWorkerRegistration` を
  `src/lib/pwaUpdate.ts` の `scheduleUpdateChecks()` に渡している
- `scheduleUpdateChecks()` は起動直後・`visibilitychange`（アプリが前面に来たとき）・
  `pageshow`（iOS の bfcache 復帰時）に `registration.update()` を明示的に呼ぶ。
  iOS の緩慢な自動チェックに任せきりにしないための対策
- `vercel.json` で `/sw.js` に `Cache-Control: no-cache` を指定している。CDN/ブラウザに
  `sw.js`自体がキャッシュされると、更新チェックをいくら呼んでも新しい SW を取得できない
- それでも反映されない場合、最終手段はホーム画面アイコンの削除・再追加（完全に新規インストール
  扱いになる）
