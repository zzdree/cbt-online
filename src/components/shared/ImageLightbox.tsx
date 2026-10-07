'use client';

import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImageLightbox({ src, alt = 'Gambar Soal', className = '' }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <div className="relative inline-block my-2 group cursor-pointer" onClick={() => setIsOpen(true)}>
        <img
          src={src}
          alt={alt}
          className={`max-h-72 w-auto max-w-full rounded-lg border border-slate-200 dark:border-slate-800 object-contain bg-white dark:bg-slate-900 shadow-sm transition-transform duration-200 group-hover:scale-[1.01] ${className}`}
        />
        <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-slate-900/80 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-md">
            <ZoomIn className="w-3.5 h-3.5" /> Klik untuk perbesar
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 bg-slate-800/80 p-2 rounded-full transition-colors"
              aria-label="Tutup pratinjau gambar"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg shadow-2xl bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            />
            {alt && (
              <p className="text-slate-300 text-sm mt-3 text-center max-w-lg">
                {alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
