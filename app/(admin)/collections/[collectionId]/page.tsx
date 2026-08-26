import { notFound } from "next/navigation";
import CollectionForm from "../CollectionForm";
import { updateCollectionAction } from "../actions";
import { getCollectionById } from "../../../../lib/collections";

export interface EditCollectionPageProps {
  params: Promise<{
    collectionId: string;
  }>;
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const { collectionId } = await params;
  const collection = await getCollectionById(collectionId);

  if (!collection) {
    notFound();
  }

  return (
    <CollectionForm
      action={updateCollectionAction.bind(null, collectionId)}
      collection={collection}
      description="Update collection image, name, and description."
      submitLabel="Save changes"
      title={`Edit ${collection.name}`}
    />
  );
}
