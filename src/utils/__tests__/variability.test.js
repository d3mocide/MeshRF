import { describe, it, expect } from "vitest";
import {
  RELIABILITY_MODES,
  DEFAULT_RELIABILITY_MODE,
  toVariabilityParams,
} from "../../context/EnvironmentContext";

/**
 * ITM statistical variability (ROADMAP P4-6).
 *
 * These guard the JS side of the contract with the WASM module: the percentages
 * the UI produces, and the fact that omitting them yields the median 50/50/50
 * prediction that every previous release used. The C++ side (that raising the
 * percentages actually raises predicted loss) is verified against the built
 * module -- see the P4-6 notes in ROADMAP.md.
 */
describe("reliability modes (P4-6)", () => {
  it("defaults to the 50/50/50 median", () => {
    const mode = RELIABILITY_MODES[DEFAULT_RELIABILITY_MODE];
    expect(mode.time).toBe(50);
    expect(mode.loc).toBe(50);
    expect(mode.sit).toBe(50);
  });

  it("exposes an optimistic and a conservative preset around the median", () => {
    expect(RELIABILITY_MODES.OPTIMISTIC.time).toBeLessThan(RELIABILITY_MODES.TYPICAL.time);
    expect(RELIABILITY_MODES.RELIABLE.time).toBeGreaterThan(RELIABILITY_MODES.TYPICAL.time);
  });

  it("keeps every percentage within the 1-99 range ITM accepts", () => {
    for (const mode of Object.values(RELIABILITY_MODES)) {
      for (const pct of [mode.time, mode.loc, mode.sit]) {
        expect(pct).toBeGreaterThan(0);
        expect(pct).toBeLessThan(100);
      }
    }
  });

  it("gives every mode an id matching its key and a description", () => {
    for (const [key, mode] of Object.entries(RELIABILITY_MODES)) {
      expect(mode.id).toBe(key);
      expect(mode.name).toBeTruthy();
      expect(mode.description).toBeTruthy();
    }
  });
});

describe("toVariabilityParams (P4-6)", () => {
  it("maps a mode to the keys the WASM helpers expect", () => {
    expect(toVariabilityParams(RELIABILITY_MODES.RELIABLE)).toEqual({
      timePct: 90,
      locPct: 90,
      sitPct: 90,
    });
  });

  it("falls back to the median when no mode is supplied", () => {
    const expected = { timePct: 50, locPct: 50, sitPct: 50 };
    expect(toVariabilityParams(undefined)).toEqual(expected);
    expect(toVariabilityParams(null)).toEqual(expected);
    expect(toVariabilityParams({})).toEqual(expected);
  });

  it("preserves an explicit zero rather than substituting the default", () => {
    // Guards against `||` being used instead of `??` in the mapping
    expect(toVariabilityParams({ time: 0, loc: 0, sit: 0 })).toEqual({
      timePct: 0,
      locPct: 0,
      sitPct: 0,
    });
  });

  it("produces the median for the default mode, matching pre-P4-6 behaviour", () => {
    expect(toVariabilityParams(RELIABILITY_MODES[DEFAULT_RELIABILITY_MODE])).toEqual({
      timePct: 50,
      locPct: 50,
      sitPct: 50,
    });
  });
});
