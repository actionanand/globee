import { ExploreMode } from '../../core/models/geography.models';

export const nextScene = (
  currentMode: ExploreMode,
  requestedMode: ExploreMode,
  revision: number,
): { mode: ExploreMode; revision: number } => ({
  mode: requestedMode,
  revision: currentMode === requestedMode ? revision + 1 : revision,
});
