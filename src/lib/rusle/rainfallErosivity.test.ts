import { afterEach, describe, expect, it, vi } from "vitest";
import { estimateRainfallErosivity } from "./rainfallErosivity";

const climatologyResponse = {
  properties: {
    parameter: {
      PRECTOTCORR: {
        JAN: 5.93, FEB: 5.64, MAR: 3.8, APR: 3.27, MAY: 4.54, JUN: 4.23,
        JUL: 3.24, AUG: 2.68, SEP: 3.83, OCT: 6.14, NOV: 4.75, DEC: 5.43, ANN: 4.45,
      },
    },
  },
};

describe("estimateRainfallErosivity", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calcula R > 0 a partir de uma resposta real da NASA POWER (resposta gravada em 2026-08-29)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => climatologyResponse }));

    const result = await estimateRainfallErosivity(-24.8, -51.85);
    expect(result.rFactor).toBeGreaterThan(0);
    expect(result.source).toBe("NASA_POWER_MERRA2_CLIMATOLOGY_2001_2020");
    expect(result.annualPrecipitationMm).toBeGreaterThan(1000); // clima subtropical do PR
  });

  it("lança erro claro quando a API responde com HTTP não-OK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(estimateRainfallErosivity(-24.8, -51.85)).rejects.toThrow(/503/);
  });

  it("lança erro quando o mês vem com o valor sentinela de ausência (-999)", async () => {
    const broken = {
      properties: { parameter: { PRECTOTCORR: { ...climatologyResponse.properties.parameter.PRECTOTCORR, JAN: -999 } } },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => broken }));
    await expect(estimateRainfallErosivity(-24.8, -51.85)).rejects.toThrow(/JAN/);
  });
});
