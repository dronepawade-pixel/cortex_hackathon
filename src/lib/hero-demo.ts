export const DEMO_DURATION = 9000;
export const PHOTO_APPEARS_AT = 2200;
export const SCAN_STARTS_AT = 2800;
export const SCAN_ENDS_AT = 7100;

export type DemoPlayback = {
  elapsed: number;
  offset: number;
  iteration: number;
  paused: boolean;
};

export const INITIAL_PLAYBACK: DemoPlayback = {
  elapsed: 0,
  offset: 0,
  iteration: 0,
  paused: false,
};

type PlaybackAction =
  | { type: "tick"; delta: number }
  | { type: "toggle-pause" }
  | { type: "upload" }
  | { type: "replay" };

export function playbackReducer(state: DemoPlayback, action: PlaybackAction): DemoPlayback {
  switch (action.type) {
    case "tick":
      if (state.paused || !Number.isFinite(action.delta) || action.delta <= 0) return state;
      return { ...state, elapsed: Math.min(DEMO_DURATION, state.elapsed + action.delta) };
    case "toggle-pause":
      return { ...state, paused: !state.paused };
    case "upload":
      return {
        elapsed: PHOTO_APPEARS_AT,
        offset: PHOTO_APPEARS_AT,
        iteration: state.iteration + 1,
        paused: false,
      };
    case "replay":
      return { ...INITIAL_PLAYBACK, iteration: state.iteration + 1 };
  }
}

export function demoStage(elapsed: number) {
  if (elapsed < PHOTO_APPEARS_AT) return "upload";
  if (elapsed < SCAN_STARTS_AT) return "uploaded";
  if (elapsed < SCAN_ENDS_AT) return "scanning";
  return "done";
}
