"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { CalendarIcon, PlusIcon, Trash2Icon, ChevronsUpDownIcon } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { getWorkoutWithExercises } from "@/db/workouts";
import type { getExercises } from "@/db/exercises";
import {
  updateWorkoutAction,
  addExerciseAction,
  removeExerciseAction,
  addSetAction,
  removeSetAction,
} from "./actions";

type Workout = NonNullable<Awaited<ReturnType<typeof getWorkoutWithExercises>>>;
type Exercises = Awaited<ReturnType<typeof getExercises>>;
type WorkoutExercise = Workout["workoutExercises"][number];
type SetRow = WorkoutExercise["sets"][number];

function SetForm({
  workoutId,
  workoutExerciseId,
}: {
  workoutId: string;
  workoutExerciseId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [duration, setDuration] = useState("");

  function handleAdd() {
    startTransition(async () => {
      await addSetAction(workoutId, workoutExerciseId, {
        reps: reps ? parseInt(reps, 10) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        durationSeconds: duration ? parseInt(duration, 10) : undefined,
      });
      setReps("");
      setWeight("");
      setDuration("");
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 pt-1">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Reps</Label>
        <Input
          type="number"
          min={1}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="—"
          className="w-20 h-8 text-sm"
          disabled={isPending}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
        <Input
          type="number"
          min={0}
          step={0.5}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="—"
          className="w-24 h-8 text-sm"
          disabled={isPending}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Duration (s)</Label>
        <Input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="—"
          className="w-24 h-8 text-sm"
          disabled={isPending}
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={handleAdd}
        disabled={isPending || (!reps && !weight && !duration)}
      >
        <PlusIcon className="size-3.5 mr-1" />
        {isPending ? "Adding..." : "Add set"}
      </Button>
    </div>
  );
}

function SetItem({
  set,
  workoutId,
}: {
  set: SetRow;
  workoutId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const parts: string[] = [`Set ${set.setNumber}`];
  if (set.reps != null) parts.push(`${set.reps} reps`);
  if (set.weight != null) parts.push(`${parseFloat(set.weight)} kg`);
  if (set.durationSeconds != null) parts.push(`${set.durationSeconds}s`);

  return (
    <li className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>{parts.join(" · ")}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await removeSetAction(workoutId, set.id);
          })
        }
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </li>
  );
}

function ExerciseCard({
  workoutExercise,
  workoutId,
}: {
  workoutExercise: WorkoutExercise;
  workoutId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{workoutExercise.exercise.name}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await removeExerciseAction(workoutId, workoutExercise.id);
              })
            }
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {workoutExercise.sets.length > 0 && (
          <ul className="flex flex-col gap-1">
            {workoutExercise.sets.map((set) => (
              <SetItem key={set.id} set={set} workoutId={workoutId} />
            ))}
          </ul>
        )}
        <SetForm workoutId={workoutId} workoutExerciseId={workoutExercise.id} />
      </CardContent>
    </Card>
  );
}

function ExercisePicker({
  workoutId,
  exercises,
}: {
  workoutId: string;
  exercises: Exercises;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(exerciseId: string) {
    setOpen(false);
    startTransition(async () => {
      await addExerciseAction(workoutId, exerciseId);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={isPending}
        >
          <PlusIcon className="size-4 mr-1" />
          {isPending ? "Adding..." : "Add exercise"}
          <ChevronsUpDownIcon className="size-4 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search exercises..." />
          <CommandList>
            <CommandEmpty>No exercises found.</CommandEmpty>
            <CommandGroup>
              {exercises.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.name}
                  onSelect={() => handleSelect(exercise.id)}
                >
                  {exercise.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function EditWorkoutForm({
  workout,
  exercises,
}: {
  workout: Workout;
  exercises: Exercises;
}) {
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

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Exercises</h2>
          <ExercisePicker workoutId={workout.id} exercises={exercises} />
        </div>

        {workout.workoutExercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No exercises logged yet. Add one above.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {workout.workoutExercises.map((we) => (
              <ExerciseCard
                key={we.id}
                workoutExercise={we}
                workoutId={workout.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
