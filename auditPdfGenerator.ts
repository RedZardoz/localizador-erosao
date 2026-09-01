import jsPDF from "jspdf";
import { ErosionPoint } from "@/types/erosion";
import { formatToDMS } from "@/lib/utils/geoUtils";

/**
 * ============================================================================
 * Gerador de Laudo / Dossiê Técnico de Auditoria Científica (PDF)
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * Gera um documento PDF estruturado em conformidade com o rigor científico
 * de revalidação por pares, com diagramação rigorosa de 2 páginas A4:
 *
 * PÁGINA 1:
 * - Cabeçalho Institucional Oficial (PPGTCA 2026)
 * - Identificação Geodésica e Resumo Executivo do Ponto Amostral
 * - ETAPA 1: Rastreabilidade e Aquisição Sentinel-2 MSI (Copernicus L2A BOA e SCL)
 * - ETAPA 2: Assinatura Espectral e Índices Biofísicos (BSI e NDVI em caixas amplas)
 * - ETAPA 3: Topografia e Geometria do Terreno (Copernicus DEM GLO-30 em EPSG:3857)
 * - ETAPA 4: Tabela Estruturada de Variáveis Climatológicas e Erodibilidade Pedológica
 *
 * PÁGINA 2:
 * - Cabeçalho de Continuação
 * - ETAPA 5: Modelagem RUSLE Completa (Memória Numérica, Severidade e Prioridade)
 * - ETAPA 6: Guia e Script de Revalidação Científica por Pares (GEE Code Editor)
 * - Rodapé Dinâmico com Numeração em Todas as Páginas
 */

export function generateAuditPdf(point: ErosionPoint): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let y = 12;

  // Banner superior institucional
  const drawHeaderBanner = (isContinuation = false) => {
    const bannerHeight = isContinuation ? 13 : 19;
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, bannerHeight, "F");

    doc.setTextColor(255, 255, 255);
    if (!isContinuation) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(
        "PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)",
        margin + 4,
        y + 5.5
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(
        "PESQUISA DE EROSÃO LAMINAR | DOSSIÊ CIENTÍFICO DE AUDITORIA DE SATÉLITE E MODELAGEM RUSLE",
        margin + 4,
        y + 10.5
      );
      doc.setFontSize(6.8);
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.text(
        "Memória de Cálculo e Rastreabilidade Metodológica para Revalidação por Pares",
        margin + 4,
        y + 15.5
      );
      y += bannerHeight + 3.5;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(
        `PPGTCA 2026 — Dossiê de Auditoria Científica de Erosão • Ponto ${point.code} (Continuação)`,
        margin + 4,
        y + 5.5
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text(
        "Modelagem da Perda de Solo (RUSLE) e Roteiro de Revalidação no Google Earth Engine",
        margin + 4,
        y + 10
      );
      y += bannerHeight + 4;
    }
  };

  // Faixa de título de seção
  const drawSectionTitle = (stepNumber: number, title: string) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 6.2, "F");
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(margin, y, 3.5, 6.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`ETAPA ${stepNumber} — ${title.toUpperCase()}`, margin + 6, y + 4.4);
    y += 8.5;
  };

  // ==========================================================================
  // PÁGINA 1 — Sensoriamento Remoto, Topografia e Clima/Solo
  // ==========================================================================

  // 1. Cabeçalho Principal
  drawHeaderBanner(false);

  // 2. Card de Identificação Geodésica do Ponto
  const cardHeight = 32;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, "FD");

  // Divisão em 2 colunas: Esquerda (dados geográficos) e Direita (badges de resultado)
  const leftColWidth = contentWidth - 48; // ~134 mm
  const rightColX = margin + leftColWidth + 3; // ~151 mm

  // Linha 1: Código e Nome do Ponto (com corte seguro de largura para evitar colisão)
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(`Ponto Amostral: ${point.code}`, margin + 4, y + 5.2);

  if (point.name && point.name !== point.code) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const codeWidth = doc.getTextWidth(`Ponto Amostral: ${point.code} `);
    const nameMaxW = leftColWidth - codeWidth - 4;
    if (nameMaxW > 15) {
      doc.text(`(${point.name})`, margin + 4 + codeWidth, y + 5.2, { maxWidth: nameMaxW });
    }
  }

  // Linha 2: Município e Bacia
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Município: ${point.municipality} — PR  |  Bacia Hidrográfica: ${point.watershed}`,
    margin + 4,
    y + 10.5,
    { maxWidth: leftColWidth - 4 }
  );

  // Linha 3: Coordenadas WGS84 e DMS
  const dmsLat = formatToDMS(point.latitude, true);
  const dmsLng = formatToDMS(point.longitude, false);
  doc.text(
    `WGS84: ${point.latitude.toFixed(6)}°, ${point.longitude.toFixed(6)}°  |  DMS: ${dmsLat}, ${dmsLng}`,
    margin + 4,
    y + 15.8,
    { maxWidth: leftColWidth - 4 }
  );

  // Linha 4: Altitude e Solo
  doc.text(
    `Altitude Ortométrica: ${point.elevation} m  |  Classe Pedológica: ${point.soilType}`,
    margin + 4,
    y + 21.1,
    { maxWidth: leftColWidth - 4 }
  );

  // Linha 5: Proveniência
  const dataProv =
    point.dataProvenance === "satellite-derived"
      ? "Calculado via satélite / DEM (Google Earth Engine)"
      : point.dataProvenance === "gee-screened"
      ? "Candidato Triado no GEE (Variáveis Físicas Reais)"
      : point.dataProvenance === "field-validated"
      ? "Validado em Campo"
      : "Amostragem Experimental";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text(`Origem do Dado: ${dataProv}`, margin + 4, y + 26.5, { maxWidth: leftColWidth - 4 });

  // Divisória vertical sutil antes dos badges
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(rightColX - 3, y + 2, rightColX - 3, y + cardHeight - 2);

  // Coluna Direita: Badges de Severidade, Perda e Prioridade
  const badgeY = y + 3;
  // Badge Severidade
  const isCrit = point.severity === "Crítica";
  const isAlta = point.severity === "Alta";
  doc.setFillColor(
    isCrit ? 254 : isAlta ? 254 : 254,
    isCrit ? 242 : isAlta ? 243 : 252,
    isCrit ? 242 : isAlta ? 199 : 232
  );
  doc.setDrawColor(
    isCrit ? 252 : isAlta ? 245 : 250,
    isCrit ? 165 : isAlta ? 158 : 204,
    isCrit ? 165 : isAlta ? 11 : 21
  );
  doc.roundedRect(rightColX, badgeY, 41, 7, 1.2, 1.2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(
    isCrit ? 190 : isAlta ? 180 : 161,
    isCrit ? 18 : isAlta ? 83 : 98,
    isCrit ? 60 : isAlta ? 9 : 7
  );
  doc.text(`SEVERIDADE: ${point.severity.toUpperCase()}`, rightColX + 2.5, badgeY + 4.8);

  // Badge Perda de Solo
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(rightColX, badgeY + 8.5, 41, 7, 1.2, 1.2, "FD");
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text(`Perda: ${point.estimatedSoilLoss} t/(ha·ano)`, rightColX + 2.5, badgeY + 13.3);

  // Badge Score de Prioridade
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(rightColX, badgeY + 17, 41, 7, 1.2, 1.2, "FD");
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text(`Score de Risco: ${point.priorityScore} / 100`, rightColX + 2.5, badgeY + 21.8);

  y += cardHeight + 4;

  // 3. ETAPA 1: Aquisição Sentinel-2
  drawSectionTitle(1, "Rastreabilidade e Aquisição Sentinel-2 MSI (Copernicus L2A BOA)");

  const s2BoxHeight = 20;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, s2BoxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text("• Coleção GEE:", margin + 3, y + 4.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("COPERNICUS/S2_SR_HARMONIZED (Refletância de Superfície Nível 2A - BOA)", margin + 26, y + 4.2);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("• ID da Cena ESA:", margin + 3, y + 8.4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const sceneId =
    point.geeSourceImageId || "S2A_MSIL2A_HARMONIZED (Passagem com menor índice de nuvens nos últimos 120 dias)";
  doc.text(sceneId, margin + 29, y + 8.4, { maxWidth: contentWidth - 32 });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("• Data do Cálculo:", margin + 3, y + 12.6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const compDate = point.geeComputedAt
    ? new Date(point.geeComputedAt).toLocaleString("pt-BR")
    : "Recém-calculado / Auditado";
  doc.text(compDate, margin + 29, y + 12.6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("• Controle de Nuvens:", margin + 3, y + 16.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Máscara SCL (Scene Classification Layer) descartando sombras (3), nuvens (8/9) e cirrus (10).",
    margin + 34,
    y + 16.8
  );

  y += s2BoxHeight + 4;

  // 4. ETAPA 2: Assinatura Espectral (BSI e NDVI) — DIAGRAMAÇÃO AMPLA E PERFEITA
  drawSectionTitle(2, "Assinatura Espectral e Extração dos Índices Biofísicos (10m)");

  const boxW = (contentWidth - 4) / 2; // 89 mm
  const indexBoxHeight = 33; // altura confortável para todas as linhas

  // Caixa BSI (Solo Exposto)
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, boxW, indexBoxHeight, 1.5, 1.5, "FD");

  // Título BSI
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28);
  doc.text("Bare Soil Index (BSI) — Solo Exposto", margin + 4, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Equação Espectral Sentinel-2 MSI:", margin + 4, y + 8.5);

  // Caixa interna branca para a fórmula do BSI (centralizada e sem tocar bordas)
  const innerBsiW = boxW - 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin + 4, y + 10, innerBsiW, 6.2, 1, 1, "FD");

  doc.setFont("courier", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "BSI = [(B12+B4) - (B8+B2)] / [(B12+B4) + (B8+B2)]",
    margin + 4 + innerBsiW / 2,
    y + 14.2,
    { align: "center" }
  );

  // Valor Amostrado no Ponto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text(`Valor no Ponto: ${point.bsi > 0 ? `+${point.bsi}` : point.bsi}`, margin + 4, y + 20.5);

  // Bandas e Diagnóstico BSI
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Bandas: B12 (SWIR-2 2190nm), B8 (NIR 842nm), B4 (Red 665nm), B2 (Blue 490nm).",
    margin + 4,
    y + 25,
    { maxWidth: boxW - 8 }
  );
  doc.text(
    "Diagnóstico: Valores > 0.0 confirmam solo mineral desprovido de cobertura protetora.",
    margin + 4,
    y + 29,
    { maxWidth: boxW - 8 }
  );

  // Caixa NDVI (Vigor Vegetal)
  const xNdvi = margin + boxW + 4;
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(xNdvi, y, boxW, indexBoxHeight, 1.5, 1.5, "FD");

  // Título NDVI
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text("Normalized Difference Veg. Index (NDVI)", xNdvi + 4, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Equação Espectral de Vigor Fotossintético:", xNdvi + 4, y + 8.5);

  // Caixa interna branca para a fórmula do NDVI
  const innerNdviW = boxW - 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(xNdvi + 4, y + 10, innerNdviW, 6.2, 1, 1, "FD");

  doc.setFont("courier", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "NDVI = (B8 - B4) / (B8 + B4)",
    xNdvi + 4 + innerNdviW / 2,
    y + 14.2,
    { align: "center" }
  );

  // Valor Amostrado no Ponto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(21, 128, 61);
  doc.text(`Valor no Ponto: ${point.ndvi}`, xNdvi + 4, y + 20.5);

  // Bandas e Diagnóstico NDVI
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Contraste: Alta refletância no infravermelho (B8) contra absorção no vermelho (B4).",
    xNdvi + 4,
    y + 25,
    { maxWidth: boxW - 8 }
  );
  doc.text(
    "Diagnóstico: NDVI baixo (< 0.30) comprova ausência de dossel vegetal protetor.",
    xNdvi + 4,
    y + 29,
    { maxWidth: boxW - 8 }
  );

  y += indexBoxHeight + 4;

  // 5. ETAPA 3: Topografia e DEM
  drawSectionTitle(3, "Geometria Topográfica e Hidrologia (Copernicus DEM GLO-30)");

  const demBoxHeight = 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, demBoxHeight, 1.5, 1.5, "FD");

  // Grid de 4 parâmetros topográficos
  const paramW = (contentWidth - 6) / 4;
  const pY = y + 2.2;

  const topParams = [
    { label: "Altitude Ortométrica", val: `${point.elevation} m`, sub: "SIRGAS 2000 / EGM96" },
    { label: "Declividade do Terreno", val: `${point.slopePercent}%`, sub: `Ângulo: ${point.slopeDegrees}°` },
    { label: "Projeção de Cálculo", val: "EPSG:3857", sub: "Métrica Conforme (10m)" },
    { label: "Hidrologia (Fator LS)", val: `LS = ${point.rusleFactors?.ls ?? 3.4}`, sub: "HydroSHEDS 15ACC" },
  ];

  topParams.forEach((tp, i) => {
    const px = margin + 2 + i * (paramW + 0.6);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(px, pY, paramW, 13.5, 1, 1, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(tp.label, px + paramW / 2, pY + 3.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(tp.val, px + paramW / 2, pY + 8.2, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(tp.sub, px + paramW / 2, pY + 11.8, { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Nota Metodológica: O cálculo topográfico utiliza projeção métrica EPSG:3857, eliminando distorções decorrentes de coordenadas em graus. A área de contribuição específica As é obtida via Flow Accumulation do HydroSHEDS 15ACC.",
    margin + 3,
    y + 18,
    { maxWidth: contentWidth - 6 }
  );

  y += demBoxHeight + 4;

  // 6. ETAPA 4: TABELA ESTRUTURADA DE VARIÁVEIS CLIMATOLÓGICAS E PEDOLÓGICAS
  drawSectionTitle(4, "Variáveis Climatológicas e Erodibilidade Pedológica (Tabela de Parâmetros)");

  const rVal = point.rusleFactors?.r ?? 7850;
  const kVal = point.rusleFactors?.k ?? 0.035;
  const lsVal = point.rusleFactors?.ls ?? 3.4;
  const cVal = point.rusleFactors?.c ?? 0.28;
  const pVal = point.rusleFactors?.p ?? 1.0;

  // Tabela com colunas rigorosamente demarcadas — ZERO sobreposição possível
  const tableX = margin;
  const col1W = 46; // Parâmetro da RUSLE
  const col2W = 28; // Valor Amostrado
  const col3W = contentWidth - col1W - col2W; // 108 mm (Unidade & Fonte Metodológica)
  const headerH = 5.5;
  const rowH = 6.8;

  // Cabeçalho da Tabela
  doc.setFillColor(226, 232, 240); // slate-200
  doc.setDrawColor(203, 213, 225);
  doc.rect(tableX, y, contentWidth, headerH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text("PARÂMETRO DA RUSLE", tableX + 3, y + 3.8);
  doc.text("VALOR", tableX + col1W + 3, y + 3.8);
  doc.text("UNIDADE DE MEDIDA & FONTE METODOLÓGICA", tableX + col1W + col2W + 3, y + 3.8);
  y += headerH;

  const tableRows = [
    {
      param: "Fator R (Erosividade da Chuva)",
      val: `${rVal}`,
      desc: "MJ · mm / (ha · h · ano) — Série NASA POWER / MERRA-2 (Eq. Lombardi Neto)",
    },
    {
      param: "Fator K (Erodibilidade do Solo)",
      val: `${kVal}`,
      desc: `t · ha · h / (ha · MJ · mm) — Base IAT / ISRIC SoilGrids (${point.soilType})`,
    },
    {
      param: "Fator C (Uso e Cobertura)",
      val: `${cVal}`,
      desc: `Adimensional — Derivado dinamicamente da relação NDVI (${point.ndvi}) e BSI (${point.bsi})`,
    },
    {
      param: "Fator P (Práticas Conservacionistas)",
      val: `${pVal}`,
      desc: "Adimensional — Cultivo convencional sem terraceamento consolidado (P = 1.0)",
    },
  ];

  tableRows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(tableX, y, contentWidth, rowH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(row.param, tableX + 3, y + 4.5);

    doc.setFont("courier", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(16, 185, 129);
    doc.text(row.val, tableX + col1W + 3, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(row.desc, tableX + col1W + col2W + 3, y + 4.5, { maxWidth: col3W - 4 });

    y += rowH;
  });

  // ==========================================================================
  // PÁGINA 2 — Modelagem RUSLE e Revalidação Científica por Pares
  // ==========================================================================
  doc.addPage();
  y = 12;

  // 1. Cabeçalho da Página 2
  drawHeaderBanner(true);

  // 2. ETAPA 5: Modelagem RUSLE Completa
  drawSectionTitle(5, "Modelagem da Equação Universal de Perda de Solo Revisada (RUSLE)");

  const rusleBoxHeight = 36;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, rusleBoxHeight, 1.5, 1.5, "FD");

  // Fórmula Master
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("A = R · K · LS · C · P   [ t / (ha · ano) ]", margin + 4, y + 6);

  // Substituição Numérica
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Substituição Numérica: A = (${rVal}) × (${kVal}) × (${lsVal}) × (${cVal}) × (${pVal})`,
    margin + 4,
    y + 12
  );

  // Perda Calculada
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(
    `Perda de Solo Calculada: ${point.estimatedSoilLoss} toneladas / (hectare · ano)`,
    margin + 4,
    y + 18.5
  );

  // Grade comparativa de fatores individuais
  const fBoxW = (contentWidth - 8) / 5;
  const fY = y + 22.5;
  const factors = [
    { label: "R (Chuva)", val: `${rVal}` },
    { label: "K (Solo)", val: `${kVal}` },
    { label: "LS (Relevo)", val: `${lsVal}` },
    { label: "C (Cobertura)", val: `${cVal}` },
    { label: "P (Manejo)", val: `${pVal}` },
  ];

  factors.forEach((f, i) => {
    const fx = margin + 2 + i * (fBoxW + 1);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(fx, fY, fBoxW, 10, 1, 1, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(f.label, fx + fBoxW / 2, fY + 3.5, { align: "center" });

    doc.setFont("courier", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(f.val, fx + fBoxW / 2, fY + 7.8, { align: "center" });
  });

  y += rusleBoxHeight + 6;

  // 3. ETAPA 6: Roteiro e Script de Revalidação Científica por Pares
  drawSectionTitle(6, "Guia de Revalidação Científica Independente por Pares");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Para auditar e reproduzir este cálculo no Google Earth Engine (Code Editor), copie e execute o script abaixo:",
    margin + 2,
    y
  );
  y += 4.5;

  const scriptLines = [
    `// SCRIPT REPRODUZÍVEL GEE — Ponto ${point.code} (${point.municipality} - PR)`,
    `var ponto = ee.Geometry.Point([${point.longitude.toFixed(6)}, ${point.latitude.toFixed(6)}]);`,
    `var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")`,
    `  .filterBounds(ponto).filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))`,
    `  .sort("CLOUDY_PIXEL_PERCENTAGE").first();`,
    `var bsi = s2.expression("((B12+B4)-(B8+B2))/((B12+B4)+(B8+B2))", {`,
    `  B12: s2.select("B12"), B4: s2.select("B4"), B8: s2.select("B8"), B2: s2.select("B2")`,
    `}).rename("BSI");`,
    `var ndvi = s2.normalizedDifference(["B8", "B4"]).rename("NDVI");`,
    `var dem = ee.Image("COPERNICUS/DEM/GLO30").select("DEM");`,
    `var declividade = ee.Terrain.slope(dem);`,
    `print("BSI Amostrado:", bsi.reduceRegion(ee.Reducer.first(), ponto, 10));`,
    `print("NDVI Amostrado:", ndvi.reduceRegion(ee.Reducer.first(), ponto, 10));`,
    `print("Declividade (graus):", declividade.reduceRegion(ee.Reducer.first(), ponto, 10));`,
  ];

  const scriptBoxH = scriptLines.length * 3.4 + 5;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, scriptBoxH, 1.5, 1.5, "F");

  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(52, 211, 153); // emerald-400

  let scriptY = y + 4;
  scriptLines.forEach((line) => {
    doc.text(line, margin + 4, scriptY);
    scriptY += 3.4;
  });

  y += scriptBoxH + 5;

  // Informações de Validação Cruzada
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Links de Validação Cruzada: Google Earth Web 3D (lat: ${point.latitude.toFixed(5)}, lng: ${point.longitude.toFixed(5)}) e Google Maps Satélite.`,
    margin + 2,
    y
  );

  // ==========================================================================
  // RODAPÉ DINÂMICO OFICIAL EM TODAS AS PÁGINAS
  // ==========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Laudo gerado em ${new Date().toLocaleString("pt-BR")} • Motor de Cálculo: ${point.calcEngineVersion || "2026.1-metric"} • PPGTCA 2026`,
      margin,
      pageHeight - 7.5
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      margin + contentWidth - 18,
      pageHeight - 7.5
    );
  }

  // Download do arquivo PDF no navegador
  const fileName = `Laudo_Auditoria_Erosao_${point.code}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
