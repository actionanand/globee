const DATELINE_TOLERANCE = 0.001;
const POLAR_TOLERANCE = 0.001;

/**
 * A ring may close through the antimeridian, or at a pole after RFC 7946
 * wrapping. Other longitude jumps larger than 180 degrees are invalid.
 */
export const isAllowedDatelineEdge = ([west, south], [east, north]) => {
  const reachesDateline =
    Math.abs(Math.abs(west) - 180) <= DATELINE_TOLERANCE &&
    Math.abs(Math.abs(east) - 180) <= DATELINE_TOLERANCE;
  const reachesPole =
    Math.abs(Math.abs(south) - 90) <= POLAR_TOLERANCE ||
    Math.abs(Math.abs(north) - 90) <= POLAR_TOLERANCE;
  return reachesDateline || reachesPole;
};
