'use client';

import React, { useEffect, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImageLightbox({ src, alt = 'Gambar Soal', className = '' }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !src) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, src]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Perbesar gambar"
        className="relative inline-block my-2 group cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
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
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau gambar soal"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-slate-300 bg-slate-800/80 p-2 rounded-full transition-colors"
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
