import { describe, expect, it } from 'vitest';
import { parseCapeText } from './capeParser';
import { loadPasteFixture } from '../test/fixtures/loadPasteFixture';

function removeLineAfterHeading(text: string, heading: string): string {
  const lines = text.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.includes(heading));
  if (headingIndex === -1) return text;
  
  let targetIndex = headingIndex + 1;
  while (targetIndex < lines.length && lines[targetIndex].trim() === '') {
    targetIndex++;
  }
  
  if (targetIndex < lines.length) {
    lines.splice(targetIndex, 1);
  }
  return lines.join('\n');
}

function replaceLineAfterHeading(text: string, heading: string, replacement: string): string {
  const lines = text.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.includes(heading));
  if (headingIndex === -1) return text;
  
  let targetIndex = headingIndex + 1;
  while (targetIndex < lines.length && lines[targetIndex].trim() === '') {
    targetIndex++;
  }
  
  if (targetIndex < lines.length) {
    lines[targetIndex] = replacement;
  }
  return lines.join('\n');
}

function moveLineMatchingToAfterHeading(text: string, match: RegExp, heading: string): string {
  const lines = text.split(/\r?\n/);
  const lineIndex = lines.findIndex((line) => match.test(line));
  if (lineIndex === -1) return text;
  
  const [line] = lines.splice(lineIndex, 1);
  
  const headingIndex = lines.findIndex((l) => l.includes(heading));
  if (headingIndex === -1) return text;
  
  lines.splice(headingIndex + 1, 0, line);
  return lines.join('\n');
}

describe('parseCapeText', () => {
  const fixtureCases = [
    {
      name: 'cluster-no-emoji',
      capeClass: 'Thinker',
      subclass: 'Strategist',
      hasPrepper: false,
      stats: { strength: 3, vitality: 6, utility: 5, control: 2, technique: 6 },
    },
    {
      name: 'cluster-with-emoji',
      capeClass: 'Thinker',
      subclass: 'Strategist',
      hasPrepper: false,
      stats: { strength: 3, vitality: 6, utility: 5, control: 2, technique: 6 },
    },
    {
      name: 'pure-no-emoji',
      capeClass: 'Blaster',
      subclass: 'Nuker',
      hasPrepper: false,
      stats: { strength: 6, vitality: 6, utility: 3, control: 4, technique: 3 },
    },
    {
      name: 'pure-with-emoji',
      capeClass: 'Blaster',
      subclass: 'Nuker',
      hasPrepper: false,
      stats: { strength: 6, vitality: 6, utility: 3, control: 4, technique: 3 },
    },
    {
      name: 'pure-with-emoji-and-prepper',
      capeClass: 'Tinker',
      subclass: 'Ambush',
      hasPrepper: true,
      stats: { strength: 4, vitality: 3, utility: 9, control: 7, technique: 4 },
    },
  ] as const;

  for (const fixtureCase of fixtureCases) {
    it(`parses ${fixtureCase.name} cape paste into editable state`, () => {
      expect(parseCapeText(loadPasteFixture(fixtureCase.name))).toEqual({
        cape: {
          capeClass: fixtureCase.capeClass,
          subclass: fixtureCase.subclass,
          hasPrepper: fixtureCase.hasPrepper,
          stats: fixtureCase.stats,
        },
        warnings: [],
      });
    });
  }

  it('warns when class and most stats are missing', () => {
    expect(parseCapeText('Strength: 4')).toEqual({
      cape: {
        capeClass: '',
        subclass: '',
        hasPrepper: false,
        stats: {
          strength: 4,
          vitality: 3,
          utility: 4,
          control: 3,
          technique: 4,
        },
      },
      warnings: [
        'Could not find cape class.',
        'Could not find subclass.',
        'Could not find vitality.',
        'Could not find utility.',
        'Could not find control.',
        'Could not find technique.',
      ],
    });
  });

  describe('negative fixtures', () => {
    it('fails to parse class when line after heading is removed', () => {
      const base = loadPasteFixture('cluster-with-emoji');
      const text = removeLineAfterHeading(base, 'Class');
      const result = parseCapeText(text);
      expect(result.cape.capeClass).toBe('');
      expect(result.cape.subclass).toBe('');
      expect(result.warnings).toContain('Could not find cape class.');
      expect(result.warnings).toContain('Could not find subclass.');
    });

    it('warns when class is unknown', () => {
      const base = loadPasteFixture('cluster-with-emoji');
      const text = replaceLineAfterHeading(base, 'Class', 'Unknown (Strategist)');
      const result = parseCapeText(text);
      expect(result.cape.capeClass).toBe('');
      expect(result.cape.subclass).toBe('');
      expect(result.warnings).toContain('Could not find cape class.');
    });

    it('warns when subclass is unknown', () => {
      const base = loadPasteFixture('cluster-with-emoji');
      const text = replaceLineAfterHeading(base, 'Class', 'Thinker (Unknown)');
      const result = parseCapeText(text);
      expect(result.cape.capeClass).toBe('Thinker');
      expect(result.cape.subclass).toBe('');
      expect(result.warnings).toContain('Could not find subclass.');
    });

    it('fails to parse base stats when base stats line is removed', () => {
      const base = loadPasteFixture('cluster-with-emoji');
      const text = removeLineAfterHeading(base, 'Base Stats');
      const result = parseCapeText(text);
      expect(result.cape.stats.strength).toBe(4); // Default EMPTY_STATS
      expect(result.warnings).toContain('Could not find strength.');
    });

    it('ignores prepper outside of active feats section', () => {
      const base = loadPasteFixture('pure-with-emoji-and-prepper');
      // Replace active Prepper line with something else
      let text = base.replace(/[•-]\s*Prepper/i, '• Another Feat');
      // Add Prepper to Unused feats
      text = text.replace('Unused feats', 'Unused feats\n• Prepper');
      
      const result = parseCapeText(text);
      expect(result.cape.hasPrepper).toBe(false);
    });

    it('ignores prepper when moved to unused feats', () => {
      const base = loadPasteFixture('pure-with-emoji-and-prepper');
      const text = moveLineMatchingToAfterHeading(base, /Prepper/i, 'Unused feats');
      
      const result = parseCapeText(text);
      expect(result.cape.hasPrepper).toBe(false);
    });
  });
});
