import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "@/components/new-admin/post-editor";

export const metadata = { title: "Write a post" };

export default function NewPostPage() {
  return (
    <>
      <Link href="/new-admin/content/blog" className="-mb-2 inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-[#0a0a0a]/55 hover:text-[#0a0a0a]"><ArrowLeft className="h-4 w-4" /> Blog posts</Link>
      <PostEditor />
    </>
  );
}
