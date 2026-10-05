import { countContactMessages } from "@/lib/contactMessages";
import { countWorkshopInquiries } from "@/lib/workshopInquiries";

/** Unread contact messages plus unread workshop interest notes. */
export async function countUnreadInbox(): Promise<number> {
  const [messages, workshopInterest] = await Promise.all([countContactMessages(), countWorkshopInquiries()]);
  return messages + workshopInterest;
}
