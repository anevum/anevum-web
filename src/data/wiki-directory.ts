/**
 * Reader-index grouping over an already publication-cleared article array.
 * This function never loads, queries or expands canonical source material.
 */
export const WIKI_DIRECTORY_ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"] as const;

export function wikiInitial(title: string): string {
  const first = title.trim().charAt(0).toLocaleUpperCase("en");
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function wikiDirectoryGroups<T extends { title: string }>(articles: ReadonlyArray<T>): Array<{ letter: string; articles: T[] }> {
  const byInitial = new Map<string, T[]>();
  for (const article of articles) {
    const letter = wikiInitial(article.title);
    const group = byInitial.get(letter) || [];
    group.push(article);
    byInitial.set(letter, group);
  }
  return [...WIKI_DIRECTORY_ALPHABET, "#"].flatMap(letter => {
    const group = byInitial.get(letter);
    return group?.length ? [{ letter, articles: group }] : [];
  });
}

export function wikiDirectoryAnchor(letter: string): string {
  return "ow-wiki-letter-" + (letter === "#" ? "other" : letter.toLocaleLowerCase("en"));
}
