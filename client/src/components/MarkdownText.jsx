import { cn } from '../lib/utils';

/** Lightweight markdown-ish renderer (no extra dependency). */
export default function MarkdownText({ children, className }) {
  if (!children) return null;
  const text = String(children);

  const blocks = text.split(/\n\n+/);

  return (
    <div className={cn('space-y-3 text-sm leading-7 text-neutral-700 dark:text-neutral-300', className)}>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        // List block
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l) || !l.trim())) {
          return (
            <ul key={i} className="list-inside list-disc space-y-1 pl-1">
              {lines
                .filter((l) => l.trim())
                .map((l, j) => (
                  <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''))}</li>
                ))}
            </ul>
          );
        }
        // Heading
        if (lines[0]?.startsWith('### ')) {
          return (
            <h4 key={i} className="text-sm font-semibold text-neutral-900 dark:text-white">
              {inline(lines[0].slice(4))}
            </h4>
          );
        }
        if (lines[0]?.startsWith('## ')) {
          return (
            <h3 key={i} className="text-base font-semibold text-neutral-900 dark:text-white">
              {inline(lines[0].slice(3))}
            </h3>
          );
        }
        if (lines[0]?.startsWith('# ')) {
          return (
            <h2 key={i} className="text-lg font-semibold text-neutral-900 dark:text-white">
              {inline(lines[0].slice(2))}
            </h2>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(str) {
  // **bold**, *italic*, `code`, [text](url)
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(str))) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-neutral-900 dark:text-white">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith('*')) {
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith('`')) {
      parts.push(
        <code key={key++} className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-white/10">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith('[')) {
      const mm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (mm) {
        parts.push(
          <a key={key++} href={mm[2]} target="_blank" rel="noreferrer" className="underline">
            {mm[1]}
          </a>
        );
      } else parts.push(tok);
    }
    last = m.index + tok.length;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts.length ? parts : str;
}
