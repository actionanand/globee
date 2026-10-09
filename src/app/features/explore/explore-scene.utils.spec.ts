import { nextScene } from './explore-scene.utils';

describe('nextScene', () => {
  it('increments the revision when a user resets the active mode', () => {
    expect(nextScene('oceans', 'oceans', 4)).toEqual({ mode: 'oceans', revision: 5 });
  });

  it('changes modes without manufacturing a second reset', () => {
    expect(nextScene('world', 'india', 4)).toEqual({ mode: 'india', revision: 4 });
  });
});
