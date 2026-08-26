import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";

export interface ContactItem {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  replies: any[];
}

export async function listContacts(): Promise<ContactItem[]> {
  const db = await getDatabase();
  const contacts = await db
    .collection("contacts")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return contacts.map((c) => ({
    id: c._id.toString(),
    name: c.name ?? "",
    email: c.email ?? "",
    message: c.message ?? "",
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    replies: c.replies ?? [],
  }));
}

export async function getContact(id: string): Promise<ContactItem | null> {
  try {
    const db = await getDatabase();
    const contact = await db.collection("contacts").findOne({ _id: new ObjectId(id) });
    if (!contact) return null;
    return {
      id: contact._id.toString(),
      name: contact.name ?? "",
      email: contact.email ?? "",
      message: contact.message ?? "",
      createdAt: contact.createdAt ? new Date(contact.createdAt).toISOString() : new Date().toISOString(),
      replies: contact.replies ?? [],
    };
  } catch (err) {
    console.error("Failed to get contact:", err);
    return null;
  }
}
