import DownloadList from "@/components/DownloadList";
import { getSession } from "@/lib/auth";
import { downloads } from "@/lib/store";
import { downloadViewsFor } from "@/lib/delivery";

export const metadata = { title: "My downloads" };

export default async function DownloadsPage() {
  const session = await getSession();
  const rows = session ? downloads.listByUser(session.userId) : [];
  const views = downloadViewsFor(rows);

  return (
    <div>
      <h2 className="section-title">Re-downloads &amp; format switching</h2>
      {views.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-2 font-bold text-navy">Nothing to download yet</p>
          <p className="mt-1 text-sm text-muted">
            Buy a prompt pack, ebook or bundle and your files appear here forever.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            Bought an ebook as PDF? Download the EPUB here anytime. Links expire after{" "}
            <b>48 hours</b> — hit “New link” for a fresh one, free, forever.
          </p>
          <DownloadList views={views} />
        </>
      )}
    </div>
  );
}
