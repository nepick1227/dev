interface CollagePreviewProps {
  imageUrl: string;
  title: string;
}

/** 다운로드도 막힌 인앱 브라우저를 위해 길게 눌러 저장할 수 있는 실제 이미지 요소로 보여 준다 */
export default function CollagePreview({ imageUrl, title }: CollagePreviewProps) {
  return (
    <div className="mx-auto flex w-full max-w-[300px] flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`${title} 인스타그램 스토리 이미지`}
        className="aspect-[9/16] w-full rounded-xl border border-border object-cover shadow-[0_8px_24px_rgba(23,25,28,0.12)]"
      />
      <p className="mt-3 text-center text-[12px] leading-relaxed text-text-description">
        공유 창이 뜨지 않으면 이미지가 저장돼요.<br />
        저장도 안 되면 이미지를 길게 눌러 저장해 주세요.
      </p>
    </div>
  );
}
