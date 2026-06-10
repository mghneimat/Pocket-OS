import { donutSegmentPath } from '../../lib/donutSegment';

describe('donutSegmentPath', () => {
  it('returns a path for a full 360° ring (single source)', () => {
    const path = donutSegmentPath(114, 114, 96, 62, 0, 360);
    expect(path).toBeTruthy();
    expect(path).toContain('M ');
    expect(path).toContain('A ');
    expect(path).toContain('Z');
  });

  it('returns a path for a partial slice', () => {
    const path = donutSegmentPath(114, 114, 96, 62, 0, 90);
    expect(path).toBeTruthy();
  });
});
