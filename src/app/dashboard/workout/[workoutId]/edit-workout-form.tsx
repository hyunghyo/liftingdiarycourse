"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import type { getWorkoutById } from "@/db/workouts";
import { updateWorkoutAction } from "./actions";

type Workout = NonNullable<Awaited<ReturnType<typeof getWorkoutById>>>;

export function EditWorkoutForm({ workout }: { workout: Workout }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(() =>
    parse(workout.date, "yyyy-MM-dd", new Date()),
  );
  const [title, setTitle] = useState(workout.title ?? "");
  const [startTime, setStartTime] = useState(() =>
    workout.startedAt ? format(workout.startedAt, "HH:mm") : "",
  );

  function handleSelectDate(selected: Date | undefined) {
    if (!selected) return;
    setDate(selected);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      await updateWorkoutAction(
        workout.id,
        format(date, "yyyy-MM-dd"),
        title || undefined,
        startTime || undefined,
      );
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-semibold tracking-tight">Edit Workout</h1>

      <Card>
        <CardHeader>
          <CardTitle>Workout details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workout-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="workout-date" type="button" variant="outline">
                    <CalendarIcon />
                    {format(date, "do MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelectDate}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="workout-title">Title</Label>
              <Input
                id="workout-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Push Day"
                maxLength={200}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="workout-start-time">Start time</Label>
                <Input
                  id="workout-start-time"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="w-fit"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              disabled={isPending}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
