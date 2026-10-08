'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Cpu, Key, Check, AlertCircle, ExternalLink } from 'lucide-react';

export default function TeacherSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.kiosapi.com/v1');
  const [model, setModel] = useState('deepseek-chat');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/teacher/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.kiosapi_key_masked) {
            setMaskedKey(data.settings.kiosapi_key_masked);
          }
          if (data.settings.kiosapi_base_url) {
            setBaseUrl(data.settings.kiosapi_base_url);
          }
          if (data.settings.kiosapi_model) {
            setModel(data.settings.kiosapi_model);
          }
        }
      })
      .catch(() =>
        setErrorMsg('Gagal memuat pengaturan tersimpan. Periksa koneksi jaringan Anda.')
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload: any = {
        kiosapi_base_url: baseUrl.trim(),
        kiosapi_model: model,
      };

      if (apiKey.trim()) {
        payload.kiosapi_key = apiKey.trim();
      }

      const res = await fetch('/api/teacher/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan');

      setSuccessMsg('Pengaturan KiosAPI berhasil disimpan!');
      if (apiKey.trim()) {
        setMaskedKey(`${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
        setApiKey('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>

        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Pengaturan Integrasi AI (KiosAPI)
                </h1>
                <Badge variant="brand">OpenAI-Compatible</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Konfigurasikan API Key dari provider <strong>KiosAPI</strong> untuk mengaktifkan
                fitur pembuatan soal otomatis dengan model <strong>DeepSeek</strong> atau{' '}
                <strong>GPT</strong>.
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* API Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-slate-500" /> KiosAPI Secret Key
                </label>
                {maskedKey && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Tersimpan: {maskedKey}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={maskedKey ? 'Masukkan key baru untuk mengganti' : 'kios_...'}
                className="w-full text-sm font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                API Key disimpan dengan aman di database lokal server dan tidak dibagikan ke sisi siswa.
              </p>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Base URL Endpoint
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.kiosapi.com/v1"
                className="w-full text-sm font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Standar endpoint KiosAPI adalah <code className="font-mono">https://api.kiosapi.com/v1</code>.
              </p>
            </div>

            {/* Default Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Model Bawaan
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="deepseek-chat">DeepSeek Chat (Sangat Hemat &amp; Cepat)</option>
                <option value="deepseek-reasoner">DeepSeek Reasoner (R1 - Penalaran Matematika Mendalam)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (OpenAI Cepat &amp; Stabil)</option>
                <option value="gpt-4o">GPT-4o (Kualitas Terbaik)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" variant="primary" size="md" isLoading={saving}>
                Simpan Konfigurasi
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
