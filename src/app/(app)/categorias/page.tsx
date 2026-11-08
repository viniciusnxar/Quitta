import { Suspense } from "react";
import { CategoriesView } from "@/components/categories/categories-view";
import { listCategories, listTags } from "@/features/categories/queries";

export default function CategoriesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense fallback={<Skeleton />}>
        <Categories />
      </Suspense>
    </div>
  );
}

async function Categories() {
  const [categories, tags] = await Promise.all([listCategories(), listTags()]);
  return <CategoriesView categories={categories} tags={tags} />;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
