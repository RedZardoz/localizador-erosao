import { describe, it, expect } from "vitest";
import {
  STRATA_DEFINITIONS,
  classifySlope,
  classifySoilGroup,
  getStratumCode,
  getStratumInfo,
} from "./stratificationConstants";

describe("stratification - Definições e Matriz de Estratos", () => {
  it("deve conter exatamente 6 estratos cobrindo A1..B3 conforme o README §3", () => {
    const keys = Object.keys(STRATA_DEFINITIONS);
    expect(keys).toHaveLength(6);

    expect(STRATA_DEFINITIONS[1].id).toBe("A1");
    expect(STRATA_DEFINITIONS[1].samplingPriority).toBe("Moderada");

    expect(STRATA_DEFINITIONS[2].id).toBe("A2");
    expect(STRATA_DEFINITIONS[2].samplingPriority).toBe("Elevada");

    expect(STRATA_DEFINITIONS[3].id).toBe("A3");
    expect(STRATA_DEFINITIONS[3].samplingPriority).toBe("Crítica");

    expect(STRATA_DEFINITIONS[4].id).toBe("B1");
    expect(STRATA_DEFINITIONS[4].samplingPriority).toBe("Controle");

    expect(STRATA_DEFINITIONS[5].id).toBe("B2");
    expect(STRATA_DEFINITIONS[5].samplingPriority).toBe("Moderada");

    expect(STRATA_DEFINITIONS[6].id).toBe("B3");
    expect(STRATA_DEFINITIONS[6].samplingPriority).toBe("Elevada");
  });
});

describe("classifySlope - Classificação de Declividade", () => {
  it("deve classificar corretamente declividades baixas (< 6%)", () => {
    expect(classifySlope(0)).toBe(0);
    expect(classifySlope(3.5)).toBe(0);
    expect(classifySlope(5.99)).toBe(0);
  });

  it("deve classificar corretamente declividades médias (6% a 12%)", () => {
    expect(classifySlope(6.0)).toBe(1);
    expect(classifySlope(8.5)).toBe(1);
    expect(classifySlope(12.0)).toBe(1);
  });

  it("deve classificar corretamente declividades altas (> 12%)", () => {
    expect(classifySlope(12.01)).toBe(2);
    expect(classifySlope(18.0)).toBe(2);
    expect(classifySlope(35.0)).toBe(2);
  });
});

describe("classifySoilGroup - Classificação Pedológica de Erodibilidade", () => {
  it("deve classificar Argissolos e Neossolos como Grupo A (Alta Erodibilidade)", () => {
    expect(classifySoilGroup("Argissolo Vermelho-Amarelo")).toBe("A");
    expect(classifySoilGroup("Neossolo Regolítico")).toBe("A");
    expect(classifySoilGroup("Neossolo Litólico")).toBe("A");
    expect(classifySoilGroup("Arenito Caiuá")).toBe("A");
  });

  it("deve classificar Latossolos, Nitossolos e Cambissolos como Grupo B", () => {
    expect(classifySoilGroup("Latossolo Vermelho Distroférrico")).toBe("B");
    expect(classifySoilGroup("Latossolo Vermelho Eutroférrico")).toBe("B");
    expect(classifySoilGroup("Nitossolo Vermelho")).toBe("B");
    expect(classifySoilGroup("Cambissolo Háplico")).toBe("B");
  });

  it("deve classificar por valor numérico do Fator K", () => {
    expect(classifySoilGroup(0.045)).toBe("A"); // K >= 0.030
    expect(classifySoilGroup(0.030)).toBe("A");
    expect(classifySoilGroup(0.020)).toBe("B"); // K < 0.030
    expect(classifySoilGroup(0.015)).toBe("B");
  });
});

describe("getStratumCode e getStratumInfo - Cruzamento de Estratos", () => {
  it("deve retornar o código correto para os 6 cenários da matriz", () => {
    // Grupo A (Alta Erodibilidade)
    expect(getStratumCode(4.0, "Argissolo Vermelho-Amarelo")).toBe(1); // A1
    expect(getStratumCode(8.0, "Argissolo Vermelho-Amarelo")).toBe(2); // A2
    expect(getStratumCode(15.0, "Neossolo Regolítico")).toBe(3); // A3

    // Grupo B (Média/Baixa Erodibilidade)
    expect(getStratumCode(4.0, "Latossolo Vermelho Distroférrico")).toBe(4); // B1
    expect(getStratumCode(8.0, "Latossolo Vermelho Eutroférrico")).toBe(5); // B2
    expect(getStratumCode(15.0, "Nitossolo Vermelho")).toBe(6); // B3
  });

  it("deve buscar StratumInfo por código ou por ID", () => {
    expect(getStratumInfo(3)?.id).toBe("A3");
    expect(getStratumInfo("A3")?.code).toBe(3);
    expect(getStratumInfo("A3")?.samplingPriority).toBe("Crítica");

    expect(getStratumInfo(4)?.id).toBe("B1");
    expect(getStratumInfo("B1")?.code).toBe(4);
    expect(getStratumInfo("B1")?.samplingPriority).toBe("Controle");
  });
});
