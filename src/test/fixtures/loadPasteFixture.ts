export type PasteFixtureName =
  | 'cluster-no-emoji'
  | 'cluster-with-emoji'
  | 'pure-no-emoji'
  | 'pure-with-emoji'
  | 'pure-with-emoji-and-prepper'
  | 'inventory';

const pasteFixtures = import.meta.glob<string>('./pastes/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export function loadPasteFixture(name: PasteFixtureName): string {
  const fixture = pasteFixtures[`./pastes/${name}.txt`];
  if (!fixture) {
    throw new Error(`Missing paste fixture: ${name}`);
  }

  return fixture.trimEnd();
}
