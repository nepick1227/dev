import { createClient } from "@/lib/supabase/server";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Timeline from "@/features/mypick/Timeline";
import type { RecordWithStore } from "@/types/database";

export default async function MypickPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialRecords: RecordWithStore[] = [];
  if (user) {
    const { data } = await supabase
      .from("records")
      .select("*, stores(*)")
      .eq("user_id", user.id)
      .order("visited_at", { ascending: false });
    initialRecords = (data as RecordWithStore[]) ?? [];
  }

  return (
    <PageContainer>
      <Header title="내 픽" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Timeline initialRecords={initialRecords} />
      </div>
      <BottomNav />
    </PageContainer>
  );
}
