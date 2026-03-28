interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 모바일 최대 너비(430px) 컨테이너
 * 모든 페이지의 최상위 래퍼로 사용합니다.
 */
export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`page-container ${className}`}>
      {children}
    </div>
  );
}
