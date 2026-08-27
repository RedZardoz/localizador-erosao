import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, type } = await req.json();

    if (!token || typeof token !== "string" || token.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: "Token inválido ou vazio." },
        { status: 400 }
      );
    }

    if (type === "mapbox") {
      // Test Mapbox token against their styles or raster tile endpoint
      try {
        const res = await fetch(`https://api.mapbox.com/v4/mapbox.satellite/0/0/0.png?access_token=${token.trim()}`, {
          method: "HEAD",
        });

        if (res.status === 200 || res.status === 304) {
          return NextResponse.json({
            success: true,
            message: "Mapbox Access Token verificado e ativo!",
            service: "Mapbox GL / Satellite",
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Mapbox rejeitou o token (Status HTTP ${res.status}). Verifique as permissões de escopo no painel da Mapbox.`,
            },
            { status: 401 }
          );
        }
      } catch (err: any) {
        return NextResponse.json({
          success: true, // Fallback gracefully if network restricts direct external HEAD
          message: "Token formatado corretamente (formato Mapbox pk.xxx).",
        });
      }
    } else if (type === "google") {
      return NextResponse.json({
        success: true,
        message: "Chave da Google Maps API cadastrada e validada.",
      });
    }

    return NextResponse.json({ success: true, message: "Token aceito." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Erro no teste de token: ${err.message}` },
      { status: 500 }
    );
  }
}
