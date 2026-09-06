import { describe, it, expect } from 'vitest';
import { analyzeIntentOffline } from '../ai/rule-fallback';

describe('Offline Intent Analyzer', () => {
  it('should recognize PDF compression intent correctly', () => {
    const res1 = analyzeIntentOffline('pdf saya kegedean');
    expect(res1.recommendedToolId).toBe('compress-pdf');
    expect(res1.confidence).toBeGreaterThan(0.5);

    const res2 = analyzeIntentOffline('kecilin pdf ini biar bisa dikirim lewat whatsapp');
    expect(res2.recommendedToolId).toBe('compress-pdf');
  });

  it('should recognize PDF merge intent correctly', () => {
    const res = analyzeIntentOffline('gabung beberapa pdf jadi 1');
    expect(res.recommendedToolId).toBe('merge-pdf');
  });

  it('should generate batch workflow for multi-image email/whatsapp intent', () => {
    const res = analyzeIntentOffline('30 foto mau dikecilin dan dijadikan zip buat kirim wa');
    expect(res.workflow).toBeDefined();
    expect(res.workflow?.steps.length).toBeGreaterThanOrEqual(3);
    expect(res.workflow?.outputStrategy).toBe('zip');
  });

  it('should return undefined recommendedToolId for completely unknown query (NO FAKE RECOMMENDATIONS)', () => {
    const res = analyzeIntentOffline('nasi goreng kambing pedas resep masakan');
    expect(res.recommendedToolId).toBeUndefined();
    expect(res.confidence).toBe(0);
    expect(res.explanation).toContain('Aku belum yakin');
  });

  it('should handle empty or whitespace query gracefully', () => {
    const res = analyzeIntentOffline('    ');
    expect(res.recommendedToolId).toBeUndefined();
    expect(res.confidence).toBe(0);
  });
});
