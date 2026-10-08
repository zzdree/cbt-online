import katex from 'katex';

/**
 * Safely renders LaTeX math formulas ($...$ for inline, $$...$$ for block)
 */
export function renderMathOnly(text: string): string {
  if (!text) return '';

  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="katex-display-wrapper my-2.5 overflow-x-auto text-center">${rendered}</div>`;
    } catch {
      return match;
    }
  });

  result = result.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  return result;
}

/**
 * Parses markdown tables and wraps them with .cbt-table-container for mobile responsiveness
 */
export function parseMarkdownTables(text: string): string {
  if (!text) return '';
  const tableRegex = /((?:\|[^\n]+\|\r?\n)(?:\|[-:\|\s]+\|\r?\n)(?:\|[^\n]+\|\r?\n?)+)/g;

  return text.replace(tableRegex, (match) => {
    const lines = match.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return match;

    const headerCols = lines[0].split('|').slice(1, -1).map(c => c.trim());
    const bodyRows = lines.slice(2).map(row =>
      row.split('|').slice(1, -1).map(c => c.trim())
    );

    let html = '<div class="cbt-table-container"><table class="cbt-table"><thead><tr>';
    for (const col of headerCols) {
      html += `<th>${renderMathOnly(col)}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (const row of bodyRows) {
      html += '<tr>';
      for (const cell of row) {
        html += `<td>${renderMathOnly(cell)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  });
}

/**
 * Full Rich Content Parser: Tables + Math + Basic Markdown + Newlines
 */
export function parseRichContent(content: string): string {
  if (!content) return '';

  // Tables parsed before bold/italic so their pipe delimiters survive
  let text = parseMarkdownTables(content);

  // Bold **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text* (only single asterisks not adjacent to math)
  text = text.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');

  text = renderMathOnly(text);

  // Rendered divs (tables, display math) keep their own layout, so only the text between them gets line breaks
  const segments = text.split(/(<div[\s\S]*?<\/div>)/g);
  return segments
    .map(seg => {
      if (seg.startsWith('<div')) {
        return seg;
      }
      return seg.replace(/\r?\n/g, '<br />');
    })
    .join('');
}
