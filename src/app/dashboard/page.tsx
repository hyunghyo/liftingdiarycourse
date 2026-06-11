import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { getWorkoutsForUserByDate } from "@/db/workouts";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { date } = await searchParams;
  const dateKey = date ?? format(new Date(), "yyyy-MM-dd");

  const workouts = await getWorkoutsForUserByDate(userId, dateKey);

  return <DashboardClient workouts={workouts} dateKey={dateKey} />;
}
