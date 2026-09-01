import { describe, expect, it } from "vitest";
import { generate150MockErosionPoints } from "./mockErosionPoints";

describe("generate150MockErosionPoints", () => {
  it("gera sempre 150 pontos com IDs estáveis, independente do seedOffset", () => {
    const points = generate150MockErosionPoints(12345);
    expect(points).toHaveLength(150);
    const ids = points.map((p) => p.id);
    expect(new Set(ids).size).toBe(150); // sem IDs duplicados
  });

  it("mantém a mesma distribuição geográfica (município) entre recargas", () => {
    const a = generate150MockErosionPoints(0);
    const b = generate150MockErosionPoints(99999);
    const municipalitiesA = a.map((p) => p.municipality).sort();
    const municipalitiesB = b.map((p) => p.municipality).sort();
    // "Recarregar" não deve mudar quais municípios estão representados,
    // só o jitter/atributos de cada ponto dentro deles.
    expect(municipalitiesB).toEqual(municipalitiesA);
  });

  it("um seedOffset diferente produz coordenadas diferentes (jitter realmente muda)", () => {
    const a = generate150MockErosionPoints(0);
    const b = generate150MockErosionPoints(54321);
    const changed = a.filter((p, i) => p.latitude !== b[i].latitude || p.longitude !== b[i].longitude);
    expect(changed.length).toBeGreaterThan(100); // a grande maioria deve ter mudado
  });

  it("o mesmo seedOffset é determinístico (reprodutível)", () => {
    const a = generate150MockErosionPoints(777);
    const b = generate150MockErosionPoints(777);
    expect(a).toEqual(b);
  });
});
