import { notFound } from "next/navigation";
import Link from "next/link";
import { TERMS_CONTENT, type TermsKey } from "@/lib/terms-content";

interface Props {
  params: Promise<{ key: string }>;
}

export default async function TermsViewPage({ params }: Props) {
  const { key } = await params;

  if (!(key in TERMS_CONTENT)) notFound();

  const terms = TERMS_CONTENT[key as TermsKey];

  return (
    <div className="page-container">
      <div className="sticky top-0 z-10 flex items-center border-b border-border bg-surface px-5 py-4">
        <Link href="/profile" className="flex items-center p-1 pr-2" aria-label="뒤로가기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="text-[18px] font-bold tracking-tight text-text-primary">{terms.title}</h1>
      </div>
      <div className="hide-scrollbar flex-1 overflow-y-auto p-5">
        <pre className="whitespace-pre-wrap break-keep font-sans text-[14px] leading-7 text-text-secondary">
          {terms.content}
        </pre>
      </div>
    </div>
  );
}
