import PageContainer from "@/components/layout/PageContainer";
import BottomNav from "@/components/layout/BottomNav";
import MapView from "@/features/home/MapView";

export default function HomePage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col overflow-hidden">
        <MapView />
      </div>
      <BottomNav />
    </PageContainer>
  );
}
