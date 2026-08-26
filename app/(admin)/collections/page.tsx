import {
  PageHeader,
  PageSection,
} from "../../../components/admin/Sections";
import CollectionList from "./CollectionList";
import { listCollections } from "../../../lib/collections";

export default async function CollectionsPage() {
  const collections = await listCollections();

  return (
    <>
      <PageHeader
        eyebrow="Merchandising"
        title="Collections"
        description="Organize products into collections and control how they are presented across the storefront."
        actions={[
          { label: "Preview site", kind: "secondary" },
          { label: "New collection", kind: "primary", href: "/collections/new" },
        ]}
      />

      <PageSection
        title="Collection overview"
        description="Create and maintain collections used by products across the storefront."
      >
        <CollectionList collections={collections} />
      </PageSection>
    </>
  );
}
