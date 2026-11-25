import PageContainer from "@/components/layout/PageContainer";
import BottomNav from "@/components/layout/BottomNav";
import BoardView from "@/features/nepick/board-view";

interface NepickBoardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NepickBoardPage({ params }: NepickBoardPageProps) {
  const { slug } = await params;

  return (
    <PageContainer className="nepick-page">
      <BoardView key={slug} slug={slug} />
      <BottomNav />
    </PageContainer>
  );
}
