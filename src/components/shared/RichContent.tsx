'use client';

import React, { useMemo } from 'react';
import { parseRichContent } from '@/lib/rich-parser';
import { ImageLightbox } from './ImageLightbox';

interface RichContentProps {
  content: string;
  imageUrl?: string | null;
  className?: string;
}

export function RichContent({ content, imageUrl, className = '' }: RichContentProps) {
  const renderedHtml = useMemo(() => {
    return parseRichContent(content || '');
  }, [content]);

  return (
    <div className={`rich-content-root text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}>
      {imageUrl && (
        <div className="mb-3">
          <ImageLightbox src={imageUrl} alt="Lampiran Soal" />
        </div>
      )}
      <div
        className="prose prose-slate dark:prose-invert max-w-none break-words"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}
