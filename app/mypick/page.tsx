import PageContainer from "@/components/layout/PageContainer";
import BottomNav from "@/components/layout/BottomNav";
import Timeline from "@/features/mypick/Timeline";

export default function MypickPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Timeline />
      </div>
      <BottomNav />
    </PageContainer>
  );
}
