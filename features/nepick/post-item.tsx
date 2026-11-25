import type { NepickPostItem } from "@/types/database";
import PickerBadge from "./picker-badge";

interface PostItemProps {
  post: NepickPostItem;
}

export default function PostItem({ post }: PostItemProps) {
  return (
    <li className="flex flex-col gap-1 border-b border-divider py-2.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-1.5">
        {post.is_picker && <PickerBadge />}
        <span className={`truncate text-[13px] font-[800] ${post.nickname ? "text-text-primary" : "text-text-tertiary"}`}>
          {post.nickname ?? "탈퇴한 사용자"}
        </span>
      </div>
      <p className="whitespace-pre-line break-words text-[14px] leading-normal text-text-body">{post.body}</p>
    </li>
  );
}
