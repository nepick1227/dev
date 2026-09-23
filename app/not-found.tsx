import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[420px] rounded-[26px] border border-border bg-surface px-7 py-12 text-center shadow-[0_12px_36px_rgba(23,25,28,0.07)]">
        <p className="text-[13px] font-extrabold text-primary">404</p>
        <h1 className="mt-2 text-[22px] font-extrabold text-text-primary">페이지를 찾을 수 없어요</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">주소가 바뀌었거나 존재하지 않는 페이지예요.</p>
        <Link href="/home" className="mt-7 inline-flex h-12 items-center justify-center rounded-[13px] bg-primary px-7 text-[15px] font-bold text-white">
          홈으로 가기
        </Link>
      </div>
    </main>
  );
}
