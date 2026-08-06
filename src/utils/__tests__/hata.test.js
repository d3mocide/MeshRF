import { describe, it, expect } from "vitest";
import {
  calculateHataLoss,
  calculateCost231Loss,
  calculateHataFamilyLoss,
  getHataVariant,
  getHataValidity,
  calculateClientPathLoss,
  isClientSideModel,
  calculateFSPL,
} from "../rfMath";

describe("Okumura-Hata (P3-1)", () => {
  // Reference case: f=900MHz, hb=50m, hm=1.5m, d=5km, urban small/medium.
  // a(hm) = (1.1*log10(900) - 0.7)*1.5 - (1.56*log10(900) - 0.8)
  //       = (1.1*2.9542 - 0.7)*1.5 - (1.56*2.9542 - 0.8) = 3.8244 - 3.8086 = 0.0158
  // L = 69.55 + 26.16*2.9542 - 13.82*1.69897 - 0.0158
  //     + (44.9 - 6.55*1.69897)*log10(5)
  //   = 69.55 + 77.2825 - 23.4798 - 0.0158 + 33.7717*0.69897 = 146.94
  it("matches the hand-computed urban_small reference", () => {
    const loss = calculateHataLoss(5, 900, 50, 1.5, "urban_small");
    expect(loss).toBeCloseTo(146.94, 1);
  });

  it("applies the suburban correction as a reduction from urban", () => {
    const urban = calculateHataLoss(5, 900, 50, 1.5, "urban_small");
    const suburban = calculateHataLoss(5, 900, 50, 1.5, "suburban");
    // Lsub = Lu - 2*(log10(900/28))^2 - 5.4 => reduction of ~14.5 dB
    expect(suburban).toBeLessThan(urban);
    expect(urban - suburban).toBeCloseTo(2 * Math.log10(900 / 28) ** 2 + 5.4, 3);
  });

  it("orders environments urban_small > suburban > rural", () => {
    const urban = calculateHataLoss(5, 900, 50, 1.5, "urban_small");
    const suburban = calculateHataLoss(5, 900, 50, 1.5, "suburban");
    const rural = calculateHataLoss(5, 900, 50, 1.5, "rural");
    expect(urban).toBeGreaterThan(suburban);
    expect(suburban).toBeGreaterThan(rural);
  });

  it("uses the large-city mobile correction above 400 MHz", () => {
    const small = calculateHataLoss(5, 900, 50, 1.5, "urban_small");
    const large = calculateHataLoss(5, 900, 50, 1.5, "urban_large");
    // a(hm) differs, so the two must not collapse to the same value
    expect(large).not.toBeCloseTo(small, 2);
  });

  it("increases monotonically with distance", () => {
    const near = calculateHataLoss(1, 915, 50, 2, "suburban");
    const far = calculateHataLoss(15, 915, 50, 2, "suburban");
    expect(far).toBeGreaterThan(near);
  });

  it("clamps degenerate inputs instead of returning NaN/-Infinity", () => {
    expect(Number.isFinite(calculateHataLoss(0, 915, 0, 0, "suburban"))).toBe(true);
    expect(calculateHataLoss(0, 915, 0, 0, "suburban")).toBeGreaterThanOrEqual(0);
  });
});

describe("COST 231-Hata extension (P4-2)", () => {
  // f=1800MHz, hb=50m, hm=1.5m, d=5km, medium city (C=0)
  // a(hm) = (1.1*log10(1800) - 0.7)*1.5 - (1.56*log10(1800) - 0.8)
  //       = (1.1*3.25527 - 0.7)*1.5 - (1.56*3.25527 - 0.8) = 4.32120 - 4.27823 = 0.04297
  // L = 46.3 + 33.9*3.25527 - 13.82*1.69897 - 0.04297 + (44.9 - 6.55*1.69897)*0.69897
  //   = 46.3 + 110.35375 - 23.47977 - 0.04297 + 33.77175*0.69897 = 156.74
  it("matches the hand-computed 1800 MHz reference", () => {
    const loss = calculateCost231Loss(5, 1800, 50, 1.5, "urban_small");
    expect(loss).toBeCloseTo(156.74, 1);
  });

  it("adds exactly 3 dB for metropolitan centres", () => {
    const medium = calculateCost231Loss(5, 1800, 50, 1.5, "urban_small");
    const metro = calculateCost231Loss(5, 1800, 50, 1.5, "urban_large");
    expect(metro - medium).toBeCloseTo(3.0, 6);
  });

  it("has no suburban/rural term of its own", () => {
    const medium = calculateCost231Loss(5, 1800, 50, 1.5, "urban_small");
    expect(calculateCost231Loss(5, 1800, 50, 1.5, "suburban")).toBeCloseTo(medium, 6);
    expect(calculateCost231Loss(5, 1800, 50, 1.5, "rural")).toBeCloseTo(medium, 6);
  });

  it("predicts higher loss at 1800 MHz than Hata does at 900 MHz", () => {
    const hata900 = calculateHataLoss(5, 900, 50, 1.5, "urban_small");
    const cost1800 = calculateCost231Loss(5, 1800, 50, 1.5, "urban_small");
    expect(cost1800).toBeGreaterThan(hata900);
  });
});

describe("Hata family dispatch", () => {
  it("selects Okumura-Hata below the 1500 MHz crossover", () => {
    expect(getHataVariant(915)).toBe("hata");
    expect(calculateHataFamilyLoss(5, 915, 50, 1.5, "suburban")).toBeCloseTo(
      calculateHataLoss(5, 915, 50, 1.5, "suburban"),
      6,
    );
  });

  it("selects COST 231 at and above the crossover", () => {
    expect(getHataVariant(1500)).toBe("cost231");
    expect(getHataVariant(1800)).toBe("cost231");
    expect(calculateHataFamilyLoss(5, 1800, 50, 1.5, "urban_small")).toBeCloseTo(
      calculateCost231Loss(5, 1800, 50, 1.5, "urban_small"),
      6,
    );
  });
});

describe("getHataValidity", () => {
  it("reports no warnings inside the published envelope", () => {
    const { warnings, variant } = getHataValidity({
      distanceKm: 5,
      freqMHz: 915,
      txHeightM: 50,
      rxHeightM: 2,
      environment: "suburban",
    });
    expect(variant).toBe("hata");
    expect(warnings).toEqual([]);
  });

  it("flags distance, TX height and frequency excursions", () => {
    const { warnings } = getHataValidity({
      distanceKm: 40,
      freqMHz: 60,
      txHeightM: 10,
      rxHeightM: 2,
    });
    expect(warnings.some((w) => w.includes("Dist"))).toBe(true);
    expect(warnings.some((w) => w.includes("TX"))).toBe(true);
    expect(warnings.some((w) => w.includes("Freq"))).toBe(true);
  });

  it("accepts 1800 MHz (COST 231 range) without a frequency warning", () => {
    const { variant, warnings } = getHataValidity({
      distanceKm: 5,
      freqMHz: 1800,
      txHeightM: 50,
      rxHeightM: 2,
      environment: "urban_small",
    });
    expect(variant).toBe("cost231");
    expect(warnings.some((w) => w.includes("Freq"))).toBe(false);
  });

  it("warns that COST 231 lacks a suburban term", () => {
    const { warnings } = getHataValidity({
      distanceKm: 5,
      freqMHz: 1800,
      txHeightM: 50,
      rxHeightM: 2,
      environment: "suburban",
    });
    expect(warnings.some((w) => w.includes("no suburban term"))).toBe(true);
  });
});

describe("client-side path loss dispatch (P3-1)", () => {
  it("identifies which models need no backend", () => {
    expect(isClientSideModel("fspl")).toBe(true);
    expect(isClientSideModel("hata")).toBe(true);
    expect(isClientSideModel("HATA")).toBe(true);
    expect(isClientSideModel("bullington")).toBe(false);
    expect(isClientSideModel("itm")).toBe(false);
    expect(isClientSideModel("itm_wasm")).toBe(false);
    expect(isClientSideModel(undefined)).toBe(false);
  });

  it("returns FSPL for the fspl model", () => {
    const loss = calculateClientPathLoss({
      model: "fspl",
      distanceKm: 10,
      freqMHz: 915,
      txHeightM: 10,
      rxHeightM: 2,
    });
    expect(loss).toBeCloseTo(calculateFSPL(10, 915), 6);
  });

  it("returns Hata for the hata model, honouring environment", () => {
    const loss = calculateClientPathLoss({
      model: "hata",
      distanceKm: 5,
      freqMHz: 915,
      txHeightM: 50,
      rxHeightM: 1.5,
      environment: "rural",
    });
    expect(loss).toBeCloseTo(calculateHataLoss(5, 915, 50, 1.5, "rural"), 6);
  });

  it("returns null for models that require the backend or WASM", () => {
    const base = { distanceKm: 5, freqMHz: 915, txHeightM: 50, rxHeightM: 2 };
    expect(calculateClientPathLoss({ ...base, model: "bullington" })).toBeNull();
    expect(calculateClientPathLoss({ ...base, model: "itm_wasm" })).toBeNull();
  });

  it("returns null for a non-positive distance", () => {
    expect(
      calculateClientPathLoss({
        model: "fspl",
        distanceKm: 0,
        freqMHz: 915,
        txHeightM: 10,
        rxHeightM: 2,
      }),
    ).toBeNull();
  });
});
