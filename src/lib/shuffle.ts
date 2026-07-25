/**
 * Fisher-Yates（Durstenfeld）シャッフル。元の配列は書き換えない。
 * random はテストで決定的に検証できるよう注入可能にしてある（既定は Math.random）。
 */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
