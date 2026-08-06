import { describe, it, expect } from "vitest";
import {
  parseBatchNodesCSV,
  parseNodeConfigOverrides,
  resolveDevicePreset,
  resolveAntennaPreset,
} from "../csvParser";
import { resolveNodeConfig } from "../nodeConfig";
import { ANTENNA_PRESETS, DEVICE_PRESETS } from "../../data/presets";

describe("preset resolution (P3-4)", () => {
  it("resolves devices by key, name and loose casing/spacing", () => {
    expect(resolveDevicePreset("HELTEC_V3")).toBe("HELTEC_V3");
    expect(resolveDevicePreset("heltec_v3")).toBe("HELTEC_V3");
    expect(resolveDevicePreset("Heltec V3")).toBe("HELTEC_V3");
    expect(resolveDevicePreset("heltec-v3")).toBe("HELTEC_V3");
  });

  it("resolves antennas by key and name", () => {
    expect(resolveAntennaPreset("YAGI")).toBe("YAGI");
    expect(resolveAntennaPreset("Standard Dipole")).toBe("DIPOLE");
  });

  it("returns undefined for unknown or empty values", () => {
    expect(resolveDevicePreset("NOT_A_DEVICE")).toBeUndefined();
    expect(resolveDevicePreset("")).toBeUndefined();
    expect(resolveAntennaPreset(undefined)).toBeUndefined();
  });
});

describe("parseNodeConfigOverrides (P3-4)", () => {
  it("returns undefined when a row carries no overrides", () => {
    expect(parseNodeConfigOverrides({ name: "A", lat: "1", lon: "2" })).toBeUndefined();
  });

  it("reads each optional column", () => {
    const config = parseNodeConfigOverrides({
      antenna_height: "30",
      antenna_gain: "8",
      tx_power: "22",
      device: "RAK_4631",
    });
    expect(config).toEqual({
      antennaHeight: 30,
      antennaGain: 8,
      txPower: 22,
      device: "RAK_4631",
    });
  });

  it("accepts the height/gain/power aliases", () => {
    expect(parseNodeConfigOverrides({ height: "12" }).antennaHeight).toBe(12);
    expect(parseNodeConfigOverrides({ agl: "9" }).antennaHeight).toBe(9);
    expect(parseNodeConfigOverrides({ gain: "5.8" }).antennaGain).toBe(5.8);
    expect(parseNodeConfigOverrides({ power: "27" }).txPower).toBe(27);
  });

  it("derives gain from the antenna preset when no explicit gain is given", () => {
    const config = parseNodeConfigOverrides({ antenna: "YAGI" });
    expect(config.antenna).toBe("YAGI");
    expect(config.antennaGain).toBe(ANTENNA_PRESETS.YAGI.gain);
  });

  it("lets an explicit gain win over the antenna preset", () => {
    const config = parseNodeConfigOverrides({ antenna: "YAGI", antenna_gain: "14" });
    expect(config.antennaGain).toBe(14);
  });

  it("ignores blank and unparseable cells", () => {
    expect(parseNodeConfigOverrides({ antenna_height: "", antenna_gain: "  " })).toBeUndefined();
    expect(parseNodeConfigOverrides({ antenna_height: "tall" })).toBeUndefined();
  });
});

describe("parseBatchNodesCSV (P3-4)", () => {
  it("still parses a plain Name,Lat,Lon file with no config attached", () => {
    const csv = "Name,Lat,Lon\nSite Alpha,45.5152,-122.6784\nSite Bravo,45.5252,-122.6684";
    const nodes = parseBatchNodesCSV(csv);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({ name: "Site Alpha", lat: 45.5152, lng: -122.6784 });
    expect(nodes[0].config).toBeUndefined();
  });

  it("attaches per-node config only to rows that specify it", () => {
    const csv = [
      "Name,Lat,Lon,Antenna_Height,Antenna_Gain,TX_Power,Device,Antenna",
      "Site Alpha,45.5152,-122.6784,30,8,22,HELTEC_V3,OMNI_HIGH",
      "Site Bravo,45.5252,-122.6684,,,,,",
      "Site Charlie,45.5052,-122.6884,12,,,,DIPOLE",
    ].join("\n");

    const nodes = parseBatchNodesCSV(csv);
    expect(nodes).toHaveLength(3);

    expect(nodes[0].config).toEqual({
      antennaHeight: 30,
      antennaGain: 8,
      txPower: 22,
      device: "HELTEC_V3",
      antenna: "OMNI_HIGH",
    });

    // No overrides -> inherits globals
    expect(nodes[1].config).toBeUndefined();

    // Partial: height plus antenna-derived gain
    expect(nodes[2].config).toEqual({
      antennaHeight: 12,
      antenna: "DIPOLE",
      antennaGain: ANTENNA_PRESETS.DIPOLE.gain,
    });
  });

  it("skips rows with an unparseable lat/lon", () => {
    const csv = "Name,Lat,Lon\nGood,45.5,-122.6\nBad,not-a-lat,-122.6";
    const nodes = parseBatchNodesCSV(csv);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe("Good");
  });
});

describe("resolveNodeConfig (P3-4)", () => {
  const globalConfig = {
    antennaHeight: 10,
    antennaGain: 2.15,
    txPower: 20,
    device: "HELTEC_V3",
  };

  it("falls back entirely to the global config when a node has no overrides", () => {
    const resolved = resolveNodeConfig({ name: "n" }, globalConfig);
    expect(resolved).toEqual({
      antennaHeight: 10,
      antennaGain: 2.15,
      txPower: 20,
      device: "HELTEC_V3",
      loss: DEVICE_PRESETS.HELTEC_V3.loss,
    });
  });

  it("applies overrides field-by-field, keeping globals for the rest", () => {
    const node = { config: { antennaHeight: 45, device: "STATION_G2" } };
    const resolved = resolveNodeConfig(node, globalConfig);

    expect(resolved.antennaHeight).toBe(45);
    expect(resolved.device).toBe("STATION_G2");
    expect(resolved.loss).toBe(DEVICE_PRESETS.STATION_G2.loss);
    // Untouched fields still come from the global config
    expect(resolved.antennaGain).toBe(2.15);
    expect(resolved.txPower).toBe(20);
  });

  it("does not let a zero override fall through to the global value", () => {
    const resolved = resolveNodeConfig({ config: { antennaGain: 0 } }, globalConfig);
    expect(resolved.antennaGain).toBe(0);
  });

  it("yields zero cable loss for an unknown device", () => {
    const resolved = resolveNodeConfig({ config: { device: "MYSTERY" } }, globalConfig);
    expect(resolved.loss).toBe(0);
  });
});
