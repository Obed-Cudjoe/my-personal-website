import AdminProductForm from "@/components/AdminProductForm";

export const metadata = { title: "Admin — New product" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const type = searchParams.type === "ebook" ? "ebook" : "prompt";
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="section-title">
        {type === "ebook" ? "Add a new ebook" : "Add a new prompt pack"}
      </h2>
      <AdminProductForm type={type} />
    </div>
  );
}
