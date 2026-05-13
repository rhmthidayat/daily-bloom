import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Flame, Trash2, Check, Moon, Sun, TrendingUp, Target, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Habit Tracker — Build Better Habits Daily" },
      { name: "description", content: "A clean, modern habit tracker. Add habits, check them off daily, and watch your streaks grow." },
    ],
  }),
});

type Habit = {
  id: string;
  name: string;
  createdAt: string;
  history: string[]; // ISO date strings (YYYY-MM-DD)
};

const STORAGE_KEY = "habits.v1";
const THEME_KEY = "habits.theme";

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function computeStreak(history: string[]): number {
  if (!history.length) return 0;
  const set = new Set(history);
  let streak = 0;
  const cur = new Date();
  // If today not done, start counting from yesterday
  if (!set.has(dateKey(cur))) {
    cur.setDate(cur.getDate() - 1);
  }
  while (set.has(dateKey(cur))) {
    streak += 1;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function last7Days(): string[] {
  const arr: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const c = new Date(d);
    c.setDate(d.getDate() - i);
    arr.push(dateKey(c));
  }
  return arr;
}

function Index() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHabits(JSON.parse(raw));
      const t = localStorage.getItem(THEME_KEY);
      const prefersDark = t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefersDark);
    } catch {}
    setLoaded(true);
  }, []);

  // Persist habits
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits, loaded]);

  // Theme
  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark, loaded]);

  const today = todayKey();
  const days = useMemo(() => last7Days(), []);

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setHabits((h) => [
      { id: crypto.randomUUID(), name: n, createdAt: new Date().toISOString(), history: [] },
      ...h,
    ]);
    setName("");
  };

  const toggleToday = (id: string) => {
    setHabits((hs) =>
      hs.map((h) => {
        if (h.id !== id) return h;
        const has = h.history.includes(today);
        return { ...h, history: has ? h.history.filter((d) => d !== today) : [...h.history, today] };
      }),
    );
  };

  const removeHabit = (id: string) => setHabits((hs) => hs.filter((h) => h.id !== id));

  const completedToday = habits.filter((h) => h.history.includes(today)).length;
  const total = habits.length;
  const completion = total ? Math.round((completedToday / total) * 100) : 0;
  const bestStreak = habits.reduce((m, h) => Math.max(m, computeStreak(h.history)), 0);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Habits</h1>
            <p className="mt-1 text-sm text-muted-foreground">Small steps. Every day.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setDark((d) => !d)}
            className="rounded-full"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={<CalendarCheck className="h-4 w-4" />} label="Today" value={`${completedToday}/${total}`} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Completion" value={`${completion}%`} />
          <StatCard icon={<Flame className="h-4 w-4" />} label="Best streak" value={`${bestStreak}d`} />
        </section>

        {/* Add */}
        <form onSubmit={addHabit} className="mt-6 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New habit, e.g. Read 20 minutes"
            className="h-11"
            maxLength={80}
          />
          <Button type="submit" className="h-11 px-4 gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>

        {/* List */}
        <section className="mt-6 space-y-3">
          {habits.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <Target className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No habits yet. Add your first above.</p>
            </Card>
          ) : (
            habits.map((h) => {
              const done = h.history.includes(today);
              const streak = computeStreak(h.history);
              return (
                <Card key={h.id} className="p-4 sm:p-5 group">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={() => toggleToday(h.id)}
                      aria-label={done ? "Mark incomplete" : "Mark complete"}
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all",
                        done
                          ? "bg-primary border-primary text-primary-foreground scale-100"
                          : "bg-background border-border hover:border-primary/60 hover:bg-accent",
                      )}
                    >
                      <Check className={cn("h-5 w-5 transition-opacity", done ? "opacity-100" : "opacity-0")} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={cn("font-medium truncate", done && "text-muted-foreground line-through")}>
                          {h.name}
                        </h3>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Flame className={cn("h-3.5 w-3.5", streak > 0 && "text-orange-500")} />
                          {streak} day{streak === 1 ? "" : "s"}
                        </span>
                        <WeekDots days={days} history={h.history} />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete habit"
                      onClick={() => removeHabit(h.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </section>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Saved locally on your device.
        </footer>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </Card>
  );
}

function WeekDots({ days, history }: { days: string[]; history: string[] }) {
  const set = new Set(history);
  return (
    <div className="flex items-center gap-1">
      {days.map((d) => (
        <span
          key={d}
          title={d}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            set.has(d) ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
