import katex from 'katex';

/**
 * Safely renders LaTeX math formulas ($...$ for inline, $$...$$ for block)
 */
export function renderMathOnly(text: string): string {
  if (!text) return '';

  // 1. Display math $$...$$
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

  // 2. Inline math $...$
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

  // Step 1: Parse tables first so their pipes aren't corrupted
  let text = parseMarkdownTables(content);

  // Step 2: Parse bold and italics (outside of math)
  // Bold **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text* (only single asterisks not adjacent to math)
  text = text.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');

  // Step 3: Parse KaTeX math
  text = renderMathOnly(text);

  // Step 4: Handle line breaks (preserve paragraph structure)
  // If line is not already part of an HTML block (like div or table), wrap lines in p or replace \n with <br/>
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
