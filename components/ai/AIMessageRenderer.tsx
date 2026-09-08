import React from 'react';

interface AIMessageRendererProps {
  content: string;
  isUser?: boolean;
}

export function AIMessageRenderer({ content, isUser = false }: AIMessageRendererProps) {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Direct tokenization for inline bold, italic, code, and clean plain text preserving exact spacing
  const renderInline = (rawText: string): React.ReactNode => {
    // 1. Only strip leading bullet markers if present at start of line
    let text = rawText.replace(/^[\*\-•]\s+/, '');

    // 2. Tokenize by bold (***...***, **...**, __...__), code (`...`), and italic (*...*, _..._)
    const tokenRegex = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+?`|\*[^*]+?\*|_[^_]+?_)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold + Italic: ***text***
      if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
        const inner = part.slice(3, -3);
        return (
          <strong key={index} className="font-extrabold italic text-slate-900">
            {inner}
          </strong>
        );
      }

      // Bold: **text** or __text__
      if (
        (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
      ) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} className="font-extrabold text-slate-900">
            {inner}
          </strong>
        );
      }

      // Code: `text`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-blue-700 font-mono text-[11.5px] font-semibold"
          >
            {inner}
          </code>
        );
      }

      // Italic: *text* or _text_
      if (
        (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
      ) {
        const inner = part.slice(1, -1);
        return (
          <span key={index} className="italic text-slate-700 font-medium">
            {inner}
          </span>
        );
      }

      // Normal text: strip any leftover stray asterisks or hashes, preserve all spaces
      const cleanPlain = part.replace(/^#+\s*/g, '').replace(/[*#]/g, '');
      return <React.Fragment key={index}>{cleanPlain}</React.Fragment>;
    });
  };

  // Parse blocks from markdown content
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Horizontal Rules (---, ***, ___ , --)
    if (/^(\-{2,}|_{2,}|\*{3,})$/.test(trimmed)) {
      renderedElements.push(
        <hr key={`hr-${i}`} className="my-3 border-t border-slate-200" />
      );
      i++;
      continue;
    }

    // 3. Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];

      if (level <= 2) {
        renderedElements.push(
          <h4
            key={`h-${i}`}
            className="text-[14px] font-black text-slate-900 mt-3.5 mb-1.5 flex items-center gap-1.5"
          >
            {renderInline(headingText)}
          </h4>
        );
      } else {
        renderedElements.push(
          <h5
            key={`h-${i}`}
            className="text-[13px] font-extrabold text-blue-900 mt-2.5 mb-1 flex items-center gap-1.5"
          >
            {renderInline(headingText)}
          </h5>
        );
      }
      i++;
      continue;
    }

    // 4. Numbered Lists (1. Item, 2. Item)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const itemText = numberedMatch[2];

      renderedElements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 pl-0.5">
          <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black mt-0.5">
            {num}
          </span>
          <div className="flex-1 text-[13px] leading-relaxed text-slate-700">
            {renderInline(itemText)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // 5. Bullet Lists (* Item, - Item, • Item)
    if (/^[\*\-•]\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[\*\-•]\s+/, '');
      renderedElements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2" />
          <div className="flex-1 text-[13px] leading-relaxed text-slate-700">
            {renderInline(bulletText)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // 6. Regular Paragraphs
    renderedElements.push(
      <p key={`p-${i}`} className="text-[13px] leading-relaxed text-slate-700 my-1.5">
        {renderInline(rawLine)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5 text-slate-800">{renderedElements}</div>;
}
