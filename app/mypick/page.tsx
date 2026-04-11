import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Timeline from "@/features/mypick/Timeline";

export default function MypickPage() {
  return (
    <PageContainer>
      <Header title="내 픽" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Timeline />
      </div>
      <BottomNav />
    </PageContainer>
  );
}
