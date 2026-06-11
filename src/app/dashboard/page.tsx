"use client";

import { useState } from "react";
import { format } from "date-fns";
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

const mockWorkouts = [
  {
    id: 1,
    title: "Push Day",
    completed: true,
    exercises: [
      {
        id: 1,
        name: "Bench Press",
        sets: ["Set 1 · 8 reps · 60 kg", "Set 2 · 8 reps · 60 kg", "Set 3 · 6 reps · 65 kg"],
        notes: "Felt strong today",
      },
      {
        id: 2,
        name: "Overhead Press",
        sets: ["Set 1 · 10 reps · 30 kg", "Set 2 · 10 reps · 30 kg"],
      },
    ],
  },
  {
    id: 2,
    title: "Cardio",
    completed: false,
    exercises: [
      {
        id: 3,
        name: "Treadmill Run",
        sets: ["Set 1 · 1200s"],
        notes: "Easy pace, recovery run",
      },
    ],
  },
];

export default function DashboardPage() {
  const [date, setDate] = useState<Date>(new Date());

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
              onSelect={(selected) => selected && setDate(selected)}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {mockWorkouts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No workouts logged for {format(date, "do MMM yyyy")}.
        </p>
      )}

      {mockWorkouts.map((workout) => (
        <Card key={workout.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle>{workout.title}</CardTitle>
              {workout.completed && (
                <CardDescription className="shrink-0 text-xs">
                  Completed
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id} className="flex flex-col gap-1">
                <p className="text-sm font-medium">{exercise.name}</p>
                {exercise.sets.length > 0 && (
                  <ul className="flex flex-col gap-0.5 pl-3 text-xs text-muted-foreground">
                    {exercise.sets.map((set) => (
                      <li key={set}>{set}</li>
                    ))}
                  </ul>
                )}
                {exercise.notes && (
                  <p className="pl-3 text-xs italic text-muted-foreground">
                    {exercise.notes}
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
