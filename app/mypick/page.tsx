import { createClient } from "@/lib/supabase/server";
import PageContainer from "@/components/layout/PageContainer";
import ResponsiveMyPickPage from "@/features/mypick/ResponsiveMyPickPage";
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
      <ResponsiveMyPickPage
        isAuthenticated={Boolean(user)}
        initialRecords={initialRecords}
      />
    </PageContainer>
  );
}
