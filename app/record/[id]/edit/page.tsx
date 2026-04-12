"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import RecordEditForm from "@/features/record/RecordEditForm";
import Spinner from "@/components/ui/Spinner";
import type { RecordWithStore } from "@/types/database";

export default function RecordEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [record, setRecord] = useState<RecordWithStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(id)) {
      router.replace("/mypick");
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("records")
        .select("*, stores(*)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        router.replace("/mypick");
        return;
      }

      setRecord(data as RecordWithStore);
      setIsLoading(false);
    });
  }, [id, router]);

  return (
    <PageContainer>
      <Header title="기록 수정" showBack onBack={() => router.back()} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : record ? (
          <RecordEditForm record={record} />
        ) : null}
      </div>
    </PageContainer>
  );
}
