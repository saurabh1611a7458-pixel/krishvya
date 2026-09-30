import React from 'react';

interface FormattedMarkdownProps {
  content: string;
}

/**
 * Safely parses inline markdown like **bold**, *italic*, and `code`
 * into styled React elements without leaving raw asterisks or backticks.
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex to match **bold**, *italic*, or `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-[#1F2937]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-[#1F2937]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="bg-emerald-100/60 text-[#166534] px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Cleanly renders AI messages into farmer-friendly styled sections,
 * bullet lists, numbered steps, and styled headings without raw markdown symbols.
 */
export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content }) => {
  if (!content) return null;

  const rawLines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;

    if (currentList.type === 'ul') {
      elements.push(
        <ul key={`ul_${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#1F2937] leading-relaxed">
              <span className="text-[#166534] font-bold text-base leading-none select-none mt-0.5">•</span>
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol_${elements.length}`} className="my-2 space-y-2 pl-1">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#1F2937] leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-[#EAF4EC] border border-[#d1e7d6] text-[#166534] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 select-none">
                {i + 1}
              </span>
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ol>
      );
    }

    currentList = null;
  };

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Check for bullet list item: *, -, •
    const bulletMatch = trimmed.match(/^[*•-]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Check for numbered list item: 1. , 2. , etc.
    const numberMatch = trimmed.match(/^\d+[\.)]\s+(.*)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    // Not a list item, flush any pending list
    flushList();

    // Check for Headings:
    // Case 1: Markdown #, ##, ###
    const hashHeadingMatch = trimmed.match(/^#{1,4}\s+(.*)$/);
    if (hashHeadingMatch) {
      const headingText = hashHeadingMatch[1].replace(/^\*\*|\*\*$/g, '').trim();
      elements.push(
        <h4
          key={`h_${elements.length}`}
          className="font-bold text-[#1F2937] text-sm sm:text-base mt-3 mb-1.5 tracking-tight flex items-center gap-1.5 border-b border-[#E5E7EB]/60 pb-1"
        >
          {headingText}
        </h4>
      );
      continue;
    }

    // Case 2: Standalone bold line acting as a heading: e.g. **Direct Recommendation** or **Why:** or 🌱 **Short answer**
    const standaloneBoldMatch = trimmed.match(/^([🌱💧👀📷⚠️🌾]?\s*)\*\*([^*]+)\*\*[:]?$/);
    if (standaloneBoldMatch) {
      const emojiPrefix = standaloneBoldMatch[1] ? standaloneBoldMatch[1].trim() + ' ' : '';
      const headingText = standaloneBoldMatch[2].trim();
      elements.push(
        <h4
          key={`hb_${elements.length}`}
          className="font-bold text-[#166534] text-sm mt-3 mb-1 flex items-center gap-1.5"
        >
          <span>{emojiPrefix}{headingText}</span>
        </h4>
      );
      continue;
    }

    // Case 3: Line starting with bold heading followed by text on the same line:
    // e.g. **Why:** Rain is expected tomorrow...
    const boldPrefixMatch = trimmed.match(/^([🌱💧👀📷⚠️🌾]?\s*)\*\*([^*]+)\*\*[:]\s*(.*)$/);
    if (boldPrefixMatch) {
      const emojiPrefix = boldPrefixMatch[1] ? boldPrefixMatch[1].trim() + ' ' : '';
      const headingText = boldPrefixMatch[2].trim();
      const bodyText = boldPrefixMatch[3].trim();
      elements.push(
        <div key={`hp_${elements.length}`} className="my-2">
          <span className="font-bold text-[#166534] text-sm block mb-0.5">
            {emojiPrefix}{headingText}:
          </span>
          <p className="text-sm text-[#1F2937] leading-relaxed">
            {renderInlineFormatting(bodyText)}
          </p>
        </div>
      );
      continue;
    }

    // Default: Regular paragraph
    elements.push(
      <p key={`p_${elements.length}`} className="text-sm text-[#1F2937] leading-relaxed mb-2.5">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
};
