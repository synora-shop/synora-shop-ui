import { Link2, Upload } from "lucide-react";
import { Page } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { Files } from "@/components/next-admin/files";

export const metadata = { title: "Files" };

export default function FilesPage() {
  return (
    <Page title="Files" sub="Pictures, fonts, videos and documents you use across the store." actions={<><Act msg="Paste a link to upload from"><Link2 /> From a link</Act><Act kind="primary" msg="Choose files to upload"><Upload /> Upload files</Act></>}>
      <Files />
    </Page>
  );
}
