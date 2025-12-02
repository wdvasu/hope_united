import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ActivityLoginClient from "./ActivityLoginClient";
import ActivitySheetClient from "./ActivitySheetClient";

export const dynamic = "force-dynamic";

export default async function ActivityPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const cookieStore = await cookies();
  if (searchParams?.reset === "1") {
    try { cookieStore.set("attendee", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 }); } catch {}
    redirect("/activity");
  }
  const attendeeId = cookieStore.get("attendee")?.value || "";
  if (!attendeeId) return <ActivityLoginClient />;
  const reg = await prisma.registration.findUnique({ where: { id: attendeeId }, select: { id: true, fullName: true } });
  if (!reg) {
    try { cookieStore.set("attendee", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 }); } catch {}
    return <ActivityLoginClient />;
  }
  return <ActivitySheetClient attendeeName={reg.fullName} />;
}
