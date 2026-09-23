import type { ReactNode } from "react";

interface TermsContentProps {
  content: string;
  className?: string;
}

interface LineBlock {
  type: "line";
  value: string;
}

interface TableBlock {
  type: "table";
  headers: [string, string];
  rows: Array<[string, string]>;
}

type TermsBlock = LineBlock | TableBlock;

function splitTableRow(line: string): [string, string] | null {
  const cells = line.trim().split(/\s{2,}/);
  if (cells.length < 2) return null;
  return [cells[0], cells.slice(1).join(" ")];
}

function parseTermsContent(content: string): TermsBlock[] {
  const lines = content.split("\n");
  const blocks: TermsBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headers = splitTableRow(line);
    const nextLine = lines[index + 1]?.trim() ?? "";

    if (headers && /^─+$/.test(nextLine)) {
      const rows: Array<[string, string]> = [];
      index += 2;

      while (index < lines.length && lines[index].trim()) {
        const row = splitTableRow(lines[index]);
        if (row) rows.push(row);
        index += 1;
      }

      blocks.push({ type: "table", headers, rows });
      blocks.push({ type: "line", value: "" });
      continue;
    }

    blocks.push({ type: "line", value: line });
  }

  return blocks;
}

function renderLine(value: string, index: number): ReactNode {
  if (!value.trim()) return <div key={index} className="h-4" aria-hidden="true" />;

  const trimmedValue = value.trim();
  const isArticleTitle = /^제\d+조/.test(trimmedValue) || trimmedValue === "부칙";
  const isCollectionTitle = /^\d+\. (필수|선택) 수집 항목$/.test(trimmedValue);
  const numberedItem = trimmedValue.match(/^(\d+)\.\s+(.+)$/);
  const bulletItem = trimmedValue.match(/^(·)\s*(.+)$/);

  if (numberedItem && !isCollectionTitle) {
    const isNested = value.length > value.trimStart().length;
    return (
      <p key={index} className={`grid grid-cols-[24px_minmax(0,1fr)] py-px ${isNested ? "ml-4" : ""}`}>
        <span className="tabular-nums text-text-primary">
          {numberedItem[1]}{isNested ? ")" : "."}
        </span>
        <span className="min-w-0">{numberedItem[2]}</span>
      </p>
    );
  }

  if (bulletItem) {
    return (
      <p key={index} className="ml-4 grid grid-cols-[24px_minmax(0,1fr)] py-px">
        <span className="text-text-primary">{bulletItem[1]}</span>
        <span className="min-w-0">{bulletItem[2]}</span>
      </p>
    );
  }

  return (
    <p
      key={index}
      className={isArticleTitle || isCollectionTitle ? "font-[800] text-text-primary" : undefined}
    >
      {trimmedValue}
    </p>
  );
}

export default function TermsContent({ content, className = "" }: TermsContentProps) {
  const blocks = parseTermsContent(content);

  return (
    <div className={`break-keep font-sans text-text-body ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === "line") return renderLine(block.value, index);

        return (
          <div key={index} className="my-1 overflow-hidden rounded-[14px] border border-border">
            <table className="w-full table-fixed border-collapse text-left text-[12.5px] leading-[1.55] md:text-[13px]">
              <colgroup>
                <col className="w-[36%]" />
                <col className="w-[64%]" />
              </colgroup>
              <thead className="bg-[#F6F7F9] text-text-primary">
                <tr>
                  {block.headers.map((header) => (
                    <th key={header} scope="col" className="px-3 py-2.5 font-bold md:px-4 md:py-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map(([label, purpose]) => (
                  <tr key={label} className="border-t border-divider align-top">
                    <th scope="row" className="break-words px-3 py-2.5 font-bold text-text-primary md:px-4">
                      {label}
                    </th>
                    <td className="break-words px-3 py-2.5 text-text-secondary md:px-4">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
