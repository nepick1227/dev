import { redirect } from "next/navigation";

export default function NaverVerifyPage() {
  redirect("/auth/login?error=auth_failed");
}
