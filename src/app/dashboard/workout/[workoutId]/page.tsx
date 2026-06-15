import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getWorkoutById } from "@/db/workouts";
import { EditWorkoutForm } from "./edit-workout-form";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { workoutId } = await params;
  const workout = await getWorkoutById(userId, workoutId);
  if (!workout) notFound();

  return <EditWorkoutForm workout={workout} />;
}
