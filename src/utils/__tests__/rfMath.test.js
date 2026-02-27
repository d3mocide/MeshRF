import { describe, it, expect } from "vitest";
import {
  calculateFSPL,
  calculateFresnelRadius,
  analyzeLinkProfile,
  calculateLinkBudget,
  calculateBullingtonDiffraction
} from "../rfMath";

describe("RF Math Functions", () => {
  describe("calculateFSPL", () => {
    it("should calculate free space path loss correctly", () => {
      // 915MHz, 10km
      const fspl = calculateFSPL(10, 915);
      // Expected: 20*log10(10) + 20*log10(915) + 32.45
      // 20 + 59.229 + 32.45 = 111.68
      expect(fspl).toBeCloseTo(111.68, 1);
    });

    it("should return 0 for zero distance", () => {
      expect(calculateFSPL(0, 915)).toBe(0);
    });
  });

  describe("calculateFresnelRadius", () => {
    it("should calculate first Fresnel zone radius at midpoint", () => {
      // 915MHz, 10km distance
      const radius = calculateFresnelRadius(10, 915);
      // r = 17.32 * sqrt((5 * 5) / (0.915 * 10)) = 17.32 * sqrt(25 / 9.15) = 17.32 * 1.65 = 28.58
      expect(radius).toBeCloseTo(28.58, 1);
    });
  });

  describe("analyzeLinkProfile", () => {
    it("should detect obstruction when terrain blocks LOS", () => {
      const profile = [
        { distance: 0, elevation: 100 },
        { distance: 5, elevation: 200 },
        { distance: 10, elevation: 100 },
      ];

      // Tx H = 100+10 = 110. Rx H = 100+10 = 110. LOS at 5km = 110.
      // Terrain at 5km = 200.
      // Clearance = 110 - 200 = -90.
      const result = analyzeLinkProfile(profile, 915, 10, 10);
      expect(result.isObstructed).toBe(true);
      expect(result.linkQuality).toContain("Obstructed");
    });
  });

  describe("calculateLinkBudget", () => {
    it("should subtract default fade margin (10dB) from RSSI", () => {
      const result = calculateLinkBudget({
        txPower: 20, txGain: 0, txLoss: 0, 
        rxGain: 0, rxLoss: 0, 
        distanceKm: 1, freqMHz: 915, 
        sf: 7, bw: 125 
      });
      // FSPL(1km, 915) = 32.45 + 20log(1) + 20log(915) = 32.45 + 0 + 59.23 = 91.68
      // RSSI = 20 - 91.68 - 10 = -81.68
      expect(result.rssi).toBeCloseTo(-81.68, 1);
    });

    it("should use custom fade margin", () => {
      const result = calculateLinkBudget({
        txPower: 20, txGain: 0, txLoss: 0, 
        rxGain: 0, rxLoss: 0, 
        distanceKm: 1, freqMHz: 915, 
        sf: 7, bw: 125,
        fadeMargin: 5
      });
      // RSSI = 20 - 91.68 - 5 = -76.68
      expect(result.rssi).toBeCloseTo(-76.68, 1);
    });
  });

  describe("calculateBullingtonDiffraction", () => {
    it("should apply correct loss for grazing incidence (v=0)", () => {
      // Profile where midpoint elevation matches LOS line
      const profile = [
        { distance: 0, elevation: 0 },
        { distance: 0.5, elevation: 10 },
        { distance: 1, elevation: 0 }
      ];
      // Tx=10 (AGL) + 0 (Elev) = 10m AMSL. Rx=10m AMSL. LOS=10m AMSL.
      // Obstacle at 0.5km is 10m Elev.
      // Earth bulge at 0.5km (1km link) is negligible (~0m).
      // Effective Obstacle Height = 10m.
      // h = 10 - 10 = 0.
      // v = 0. Loss ~ 6dB.
      
      const loss = calculateBullingtonDiffraction(profile, 915, 10, 10);
      // Expected: ~6.03 dB (Knife edge loss at v=0 is 6dB)
      expect(loss).toBeGreaterThan(5.9);
      expect(loss).toBeLessThan(6.2);
    });
  });
});
