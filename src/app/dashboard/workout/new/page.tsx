import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { NewWorkoutForm } from "./new-workout-form";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { date } = await searchParams;
  const dateKey = date ?? format(new Date(), "yyyy-MM-dd");

  return <NewWorkoutForm dateKey={dateKey} />;
}
