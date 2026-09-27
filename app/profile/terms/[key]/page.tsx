import { notFound } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import TermsContent from "@/components/ui/TermsContent";
import PageContainer from "@/components/layout/PageContainer";
import { TERMS_CONTENT, type TermsKey } from "@/lib/terms-content";

interface Props {
  params: Promise<{ key: string }>;
}

export default async function TermsViewPage({ params }: Props) {
  const { key } = await params;

  if (!(key in TERMS_CONTENT)) notFound();

  const terms = TERMS_CONTENT[key as TermsKey];

  return (
    <PageContainer className="settings-page">
      <div className="hide-scrollbar flex-1 overflow-y-auto bg-surface md:bg-bg">
        <div className="mx-auto w-full md:max-w-[640px] md:px-6 md:pb-[60px]">
          <div className="sticky top-0 z-10 flex h-14 items-center gap-1 border-b border-divider bg-surface px-4 md:relative md:h-auto md:border-0 md:bg-transparent md:px-0 md:pb-6 md:pt-9">
            <BackButton
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors active:bg-bg"
              fallbackHref="/profile"
            />
            <h1 className="text-[18px] font-[800] text-text-primary md:text-[22px]">
              {terms.title}
            </h1>
          </div>
          <div className="p-5 md:p-0">
            <TermsContent
              content={terms.content}
              className="w-full rounded-[18px] bg-surface text-[14px] leading-7 md:rounded-[20px] md:border md:border-divider md:p-8"
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
