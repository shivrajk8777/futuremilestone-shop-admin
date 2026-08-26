import CollectionForm from "../CollectionForm";
import { createCollectionAction } from "../actions";

export default function NewCollectionPage() {
  return (
    <CollectionForm
      action={createCollectionAction}
      description="Create a collection with image, name, and storefront-facing description."
      submitLabel="Create collection"
      title="Add collection"
    />
  );
}
