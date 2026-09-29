import { describe, expect, it } from 'vitest';
import { DEFAULT_LANDING_CONTENT, landingContentSchema, resolveLandingContent } from './landingContent';

describe('resolveLandingContent', () => {
  it('uses the defaults when nothing is stored', () => {
    expect(resolveLandingContent(null)).toEqual(DEFAULT_LANDING_CONTENT);
    expect(resolveLandingContent('garbage')).toEqual(DEFAULT_LANDING_CONTENT);
  });

  it('applies valid sections and keeps defaults for the rest', () => {
    const hero = { ...DEFAULT_LANDING_CONTENT.hero, titleLine1: 'Own your day.' };
    const result = resolveLandingContent({ hero });
    expect(result.hero.titleLine1).toBe('Own your day.');
    expect(result.system).toEqual(DEFAULT_LANDING_CONTENT.system);
  });

  it('falls back per section when a section is invalid', () => {
    const tooMany = Array.from({ length: 9 }, (_, i) => ({ title: `Item ${i}`, detail: '' }));
    const result = resolveLandingContent({
      hero: { ...DEFAULT_LANDING_CONTENT.hero, titleLine1: '' }, // empty headline is invalid
      system: { ...DEFAULT_LANDING_CONTENT.system, extras: tooMany }, // over the item limit
      closing: { ...DEFAULT_LANDING_CONTENT.closing, visible: false },
    });
    expect(result.hero).toEqual(DEFAULT_LANDING_CONTENT.hero);
    expect(result.system).toEqual(DEFAULT_LANDING_CONTENT.system);
    expect(result.closing.visible).toBe(false);
  });

  it('never mutates the defaults', () => {
    const result = resolveLandingContent(null);
    result.hero.titleLine1 = 'changed';
    expect(DEFAULT_LANDING_CONTENT.hero.titleLine1).toBe('Every day gets a score.');
  });

  it('accepts the defaults as valid content', () => {
    expect(landingContentSchema.safeParse(DEFAULT_LANDING_CONTENT).success).toBe(true);
  });
});
