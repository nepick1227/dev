import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import BoardList from "@/features/nepick/board-list";

export default function NepickPage() {
  return (
    <PageContainer>
      <Header title="네 픽" size="large" noBorder />
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto bg-surface md:bg-bg">
        <div className="app-content-readable px-5 pb-6 md:px-6">
          <p className="pb-4 pt-1 text-[14px] leading-normal text-text-secondary">
            음식마다 당신의 최고의 한 곳을 알려 주세요. 게시판마다 한 곳만 추천할 수 있어요.
          </p>
          <BoardList />
        </div>
      </div>
      <BottomNav />
    </PageContainer>
  );
}
