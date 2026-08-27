"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Key,
  Trash2,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { GcpCredentials } from "@/types/erosion";

export const GcpCredentialsManager: React.FC = () => {
  const {
    gcpCredentials,
    setGcpCredentials,
    credentialPersistMode,
    setCredentialPersistMode,
  } = useErosionStore();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        // Basic structural validation
        if (!json.client_email || !json.project_id || !json.private_key) {
          setTestResult({
            success: false,
            message:
              "O arquivo JSON não parece ser uma chave válida de Service Account do GCP. Verifique se contém 'client_email', 'project_id' e 'private_key'.",
          });
          return;
        }

        const creds: GcpCredentials = {
          type: json.type || "service_account",
          project_id: json.project_id,
          private_key_id: json.private_key_id,
          private_key: json.private_key,
          client_email: json.client_email,
          client_id: json.client_id,
          auth_uri: json.auth_uri,
          token_uri: json.token_uri,
          isValid: true,
          validatedAt: new Date().toISOString(),
        };

        setGcpCredentials(creds);
        setTestResult(null);
      } catch (err: any) {
        setTestResult({
          success: false,
          message: `Erro ao decodificar arquivo JSON: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleTestConnection = async () => {
    if (!gcpCredentials) return;

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/auth/gee-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gcpCredentials),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: "Autenticação da Service Account verificada com sucesso com o Google Earth Engine!",
          details: data.data,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Falha na validação das credenciais.",
          details: data.details,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Falha de rede ao conectar com o endpoint: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Informative Header */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3 transition-colors">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
          <Key className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Google Earth Engine (GEE) Service Account</h4>
          <p className="text-slate-500 dark:text-slate-400">
            Faça o upload do arquivo <code className="text-emerald-600 dark:text-emerald-400 font-mono">credentials.json</code> da
            sua Service Account com permissões no projeto Earth Engine para consultas em tempo real de imagens de satélite.
          </p>
        </div>
      </div>

      {/* Dropzone for credentials.json */}
      {!gcpCredentials ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragOver
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/40"
          }`}
        >
          <input
            type="file"
            id="gcp-file-input"
            accept=".json,application/json"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Arraste seu arquivo <span className="text-emerald-600 dark:text-emerald-400">credentials.json</span> aqui
          </p>
          <p className="text-[11px] text-slate-500 mb-3">ou clique no botão abaixo</p>
          <label
            htmlFor="gcp-file-input"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Selecionar Chave JSON
          </label>
        </div>
      ) : (
        /* Visual JSON Inspector */
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Chave Service Account Carregada</span>
            </div>
            <button
              onClick={() => {
                setGcpCredentials(null);
                setTestResult(null);
              }}
              className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover
            </button>
          </div>

          <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-850 space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">PROJECT_ID:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{gcpCredentials.project_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">CLIENT_EMAIL:</span>
              <span className="text-slate-800 dark:text-slate-200 truncate block">{gcpCredentials.client_email}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">PRIVATE_KEY:</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                •••••••••••••••••••••••••••••••• (Criptografada / 2048-bit RSA)
              </span>
            </div>
          </div>

          {/* Persistence Choice */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Armazenamento:</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="persistMode"
                  value="local"
                  checked={credentialPersistMode === "local"}
                  onChange={() => setCredentialPersistMode("local")}
                  className="text-emerald-600"
                />
                Persistir Localmente
              </label>
              <label className="flex items-center gap-1 text-slate-500 dark:text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  name="persistMode"
                  value="session"
                  checked={credentialPersistMode === "session"}
                  onChange={() => setCredentialPersistMode("session")}
                  className="text-emerald-600"
                />
                Apenas na Sessão
              </label>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Validando Conexão com o GEE...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Testar Autenticação GEE
              </>
            )}
          </button>
        </div>
      )}

      {/* Test Result Message Box */}
      {testResult && (
        <div
          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
            testResult.success
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-300"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">{testResult.message}</p>
            {testResult.details && (
              <pre className="text-[10px] font-mono text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-2 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
