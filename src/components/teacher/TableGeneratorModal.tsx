'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Table, Plus, Trash2 } from 'lucide-react';
import { parseMarkdownTables } from '@/lib/rich-parser';

interface TableGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (tableMarkdown: string) => void;
}

export function TableGeneratorModal({ isOpen, onClose, onInsert }: TableGeneratorModalProps) {
  const [columns, setColumns] = useState(['Kolom 1', 'Kolom 2', 'Kolom 3']);
  const [rows, setRows] = useState([
    ['Data 1', 'Data 2', 'Data 3'],
    ['Data 4', 'Data 5', 'Data 6'],
  ]);

  const addColumn = () => {
    if (columns.length >= 6) return;
    const newColName = `Kolom ${columns.length + 1}`;
    setColumns([...columns, newColName]);
    setRows(rows.map((row) => [...row, '-']));
  };

  const removeColumn = (index: number) => {
    if (columns.length <= 2) return;
    setColumns(columns.filter((_, i) => i !== index));
    setRows(rows.map((row) => row.filter((_, i) => i !== index)));
  };

  const addRow = () => {
    if (rows.length >= 10) return;
    setRows([...rows, columns.map((_, i) => `Nilai ${rows.length + 1}.${i + 1}`)]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateHeader = (colIdx: number, val: string) => {
    const updated = [...columns];
    updated[colIdx] = val;
    setColumns(updated);
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const updated = [...rows];
    updated[rowIdx][colIdx] = val;
    setRows(updated);
  };

  const generateMarkdown = (): string => {
    let md = `\n| ${columns.join(' | ')} |\n`;
    md += `| ${columns.map(() => '---').join(' | ')} |\n`;
    for (const row of rows) {
      md += `| ${row.join(' | ')} |\n`;
    }
    return md + '\n';
  };

  const handleInsert = () => {
    onInsert(generateMarkdown());
    onClose();
  };

  const previewHtml = parseMarkdownTables(generateMarkdown());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Generator Tabel Soal</span>
        </div>
      }
      description="Rancang tabel data untuk disisipkan ke dalam deskripsi soal ujian."
      size="2xl"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Ukuran Tabel: <strong className="text-slate-900 dark:text-slate-100">{columns.length} Kolom × {rows.length} Baris</strong>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColumn}
              disabled={columns.length >= 6}
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Kolom
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={rows.length >= 10}
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Baris
            </Button>
          </div>
        </div>

        {/* Interactive Editor Grid */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg max-h-64">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                {columns.map((col, cIdx) => (
                  <th key={cIdx} className="p-2 border border-slate-200 dark:border-slate-700 min-w-[130px]">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => updateHeader(cIdx, e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder="Nama Kolom"
                      />
                      {columns.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeColumn(cIdx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="Hapus kolom"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-2 border border-slate-200 dark:border-slate-700 w-10 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 border border-slate-200 dark:border-slate-700">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder="Isi sel"
                      />
                    </td>
                  ))}
                  <td className="p-2 border border-slate-200 dark:border-slate-700 text-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(rIdx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Preview */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 block mb-2">
            Pratinjau Hasil Tabel:
          </span>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handleInsert}>
            Sisipkan ke Soal
          </Button>
        </div>
      </div>
    </Modal>
  );
}
