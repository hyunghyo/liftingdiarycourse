"use client";

import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { getWorkoutsForUserByDate } from "@/db/workouts";

type Workouts = Awaited<ReturnType<typeof getWorkoutsForUserByDate>>;

function formatSet(set: Workouts[number]["workoutExercises"][number]["sets"][number]) {
  const parts: string[] = [`Set ${set.setNumber}`];

  if (set.reps != null) {
    parts.push(`${set.reps} reps`);
  }

  if (set.weight != null) {
    parts.push(`${parseFloat(set.weight)} kg`);
  }

  if (set.durationSeconds != null) {
    parts.push(`${set.durationSeconds}s`);
  }

  return parts.join(" · ");
}

export function DashboardClient({
  workouts,
  dateKey,
}: {
  workouts: Workouts;
  dateKey: string;
}) {
  const router = useRouter();
  const date = parse(dateKey, "yyyy-MM-dd", new Date());

  function handleSelect(selected: Date | undefined) {
    if (!selected) return;
    router.push(`/dashboard?date=${format(selected, "yyyy-MM-dd")}`);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon />
              {format(date, "do MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {workouts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No workouts logged for {format(date, "do MMM yyyy")}.
        </p>
      )}

      {workouts.map((workout) => (
        <Card key={workout.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle>{workout.title}</CardTitle>
              {workout.completedAt && (
                <CardDescription className="shrink-0 text-xs">
                  Completed
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {workout.workoutExercises.map((workoutExercise) => (
              <div key={workoutExercise.id} className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {workoutExercise.exercise.name}
                </p>
                {workoutExercise.sets.length > 0 && (
                  <ul className="flex flex-col gap-0.5 pl-3 text-xs text-muted-foreground">
                    {workoutExercise.sets.map((set) => (
                      <li key={set.id}>{formatSet(set)}</li>
                    ))}
                  </ul>
                )}
                {workoutExercise.notes && (
                  <p className="pl-3 text-xs italic text-muted-foreground">
                    {workoutExercise.notes}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
