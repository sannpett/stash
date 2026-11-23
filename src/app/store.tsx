import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { requireSupabase } from "./supabase";

export type GoalStatus = "active" | "paused" | "completed";
export type Goal = {
  id: string;
  name: string;
  target: number;
  deadline: string;
  status: GoalStatus;
  color: string;
  createdAt: string;
};
export type Transaction = {
  id: string;
  goalId: string;
  amount: number;
  kind: "contribution" | "withdrawal";
  category: string;
  description: string;
  date: string;
  createdAt: string;
};
export type ChallengeType =
  | "fixed"
  | "no-spend"
  | "weekly"
  | "percentage"
  | "head-to-head"
  | "group";
export type Participant = { userId: string; progress: number };
export type Challenge = {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  creatorId: string;
  participants: Participant[];
  invitedIds: string[];
};
export type FriendStatus = "friend" | "incoming" | "outgoing" | "none";
export type Person = {
  id: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  status: FriendStatus;
  progress: number;
  streak: number;
  xp: number;
};
export type FeedItem = {
  id: string;
  userId: string;
  text: string;
  date: string;
  reactions: string[];
  comments: { id: string; userId: string; text: string; date: string }[];
  target?: string;
};
export type AppNotification = {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  route: string;
  kind: string;
};
export type Profile = {
  id: string;
  name: string;
  username: string;
  initials: string;
  city: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  xp: number;
  earnedBadges: string[];
};
export type Settings = {
  privateProgress: boolean;
  friendActivity: boolean;
  challengeAlerts: boolean;
  milestoneAlerts: boolean;
  currency: string;
  reducedMotion: boolean;
  theme: "light" | "dark";
};
export type AppState = {
  version: number;
  profile: Profile;
  goals: Goal[];
  transactions: Transaction[];
  challenges: Challenge[];
  people: Person[];
  feed: FeedItem[];
  notifications: AppNotification[];
  settings: Settings;
  awarded: string[];
};

const DAY = 86_400_000;
const iso = (offset = 0) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
const stamp = (offset = 0) => new Date(Date.now() + offset * DAY).toISOString();
export const uid = (_prefix: string) =>
  crypto.randomUUID();

export const seedState: AppState = {
  version: 2,
  profile: {
    id: "me",
    name: "Alex Kim",
    username: "alexsaves",
    initials: "AK",
    city: "New York",
    xp: 2840,
    earnedBadges: ["first-step", "streak-10", "social-saver"],
  },
  goals: [
    {
      id: "g1",
      name: "Dream apartment",
      target: 12500,
      deadline: iso(190),
      status: "active",
      color: "green",
      createdAt: stamp(-80),
    },
    {
      id: "g2",
      name: "Japan trip",
      target: 3000,
      deadline: iso(95),
      status: "active",
      color: "violet",
      createdAt: stamp(-45),
    },
    {
      id: "g3",
      name: "Emergency fund",
      target: 6000,
      deadline: iso(260),
      status: "active",
      color: "blue",
      createdAt: stamp(-120),
    },
  ],
  transactions: [
    {
      id: "t1",
      goalId: "g1",
      amount: 4200,
      kind: "contribution",
      category: "Paycheck",
      description: "Opening balance",
      date: iso(-35),
      createdAt: stamp(-35),
    },
    {
      id: "t2",
      goalId: "g2",
      amount: 1650,
      kind: "contribution",
      category: "Paycheck",
      description: "Travel fund",
      date: iso(-25),
      createdAt: stamp(-25),
    },
    {
      id: "t3",
      goalId: "g3",
      amount: 2100,
      kind: "contribution",
      category: "Transfer",
      description: "Emergency savings",
      date: iso(-18),
      createdAt: stamp(-18),
    },
    {
      id: "t4",
      goalId: "g1",
      amount: 75,
      kind: "contribution",
      category: "Round-up",
      description: "Weekly auto-save",
      date: iso(-6),
      createdAt: stamp(-6),
    },
    {
      id: "t5",
      goalId: "g2",
      amount: 55,
      kind: "contribution",
      category: "Side income",
      description: "Freelance extra",
      date: iso(-4),
      createdAt: stamp(-4),
    },
    {
      id: "t6",
      goalId: "g3",
      amount: 45,
      kind: "contribution",
      category: "Transfer",
      description: "Midweek save",
      date: iso(-2),
      createdAt: stamp(-2),
    },
    {
      id: "t7",
      goalId: "g1",
      amount: 110,
      kind: "contribution",
      category: "Paycheck",
      description: "Friday boost",
      date: iso(0),
      createdAt: stamp(0),
    },
  ],
  challenges: [
    {
      id: "c1",
      title: "$500 in 30 Days",
      description: "Build momentum by saving $500 this month.",
      type: "fixed",
      target: 500,
      startDate: iso(-18),
      endDate: iso(12),
      status: "active",
      creatorId: "maya",
      participants: [
        { userId: "me", progress: 340 },
        { userId: "maya", progress: 410 },
        { userId: "jordan", progress: 305 },
      ],
      invitedIds: [],
    },
    {
      id: "c2",
      title: "Weekend Lock-In",
      description: "Avoid unnecessary spending for a full weekend.",
      type: "no-spend",
      target: 2,
      startDate: iso(-1),
      endDate: iso(1),
      status: "active",
      creatorId: "me",
      participants: [
        { userId: "me", progress: 1 },
        { userId: "noah", progress: 1 },
      ],
      invitedIds: ["sam"],
    },
    {
      id: "c3",
      title: "Bali 2026",
      description: "Five friends working toward a shared travel fund.",
      type: "group",
      target: 5000,
      startDate: iso(-30),
      endDate: iso(64),
      status: "active",
      creatorId: "sam",
      participants: [
        { userId: "me", progress: 700 },
        { userId: "maya", progress: 650 },
        { userId: "sam", progress: 400 },
        { userId: "noah", progress: 350 },
      ],
      invitedIds: [],
    },
    {
      id: "c4",
      title: "Coffee Cash Swap",
      description: "Save your usual coffee spend for 14 days.",
      type: "weekly",
      target: 70,
      startDate: iso(1),
      endDate: iso(15),
      status: "upcoming",
      creatorId: "jordan",
      participants: [{ userId: "jordan", progress: 0 }],
      invitedIds: ["me"],
    },
    {
      id: "c5",
      title: "Spring Sprint",
      description: "A completed fixed-target challenge.",
      type: "fixed",
      target: 250,
      startDate: iso(-60),
      endDate: iso(-30),
      status: "completed",
      creatorId: "me",
      participants: [
        { userId: "me", progress: 250 },
        { userId: "maya", progress: 225 },
      ],
      invitedIds: [],
    },
  ],
  people: [
    {
      id: "maya",
      name: "Maya Chen",
      username: "mayamoves",
      initials: "MA",
      color: "violet",
      status: "friend",
      progress: 92,
      streak: 18,
      xp: 4120,
    },
    {
      id: "jordan",
      name: "Jordan Lee",
      username: "jordansaves",
      initials: "JO",
      color: "blue",
      status: "friend",
      progress: 84,
      streak: 11,
      xp: 3560,
    },
    {
      id: "sam",
      name: "Sam Rivera",
      username: "samstash",
      initials: "SA",
      color: "orange",
      status: "incoming",
      progress: 71,
      streak: 8,
      xp: 2800,
    },
    {
      id: "noah",
      name: "Noah Williams",
      username: "noahgoals",
      initials: "NO",
      color: "pink",
      status: "friend",
      progress: 64,
      streak: 6,
      xp: 2440,
    },
    {
      id: "elena",
      name: "Elena Park",
      username: "elenagrows",
      initials: "EL",
      color: "blue",
      status: "none",
      progress: 59,
      streak: 4,
      xp: 2100,
    },
  ],
  feed: [
    {
      id: "f1",
      userId: "maya",
      text: "hit 75% of her Japan Trip goal",
      date: stamp(-0.02),
      reactions: ["jordan", "noah"],
      comments: [{ id: "cm1", userId: "jordan", text: "Huge progress!", date: stamp(-0.01) }],
      target: "/friends/maya",
    },
    {
      id: "f2",
      userId: "jordan",
      text: "extended a savings streak to 11 days",
      date: stamp(-0.1),
      reactions: ["maya"],
      comments: [],
      target: "/friends/jordan",
    },
    {
      id: "f3",
      userId: "noah",
      text: "joined the $500 in 30 Days challenge",
      date: stamp(-0.25),
      reactions: [],
      comments: [],
      target: "/challenges/c1",
    },
  ],
  notifications: [
    {
      id: "n1",
      title: "Friend request",
      body: "Sam Rivera wants to save with you.",
      date: stamp(-0.04),
      read: false,
      route: "/friends?view=requests",
      kind: "friend",
    },
    {
      id: "n2",
      title: "You moved up",
      body: "You are now #3 in Momentum League.",
      date: stamp(-0.2),
      read: false,
      route: "/leaderboard",
      kind: "rank",
    },
    {
      id: "n3",
      title: "Challenge update",
      body: "Maya just reached 82% in $500 in 30 Days.",
      date: stamp(-1),
      read: true,
      route: "/challenges/c1",
      kind: "challenge",
    },
  ],
  settings: {
    privateProgress: true,
    friendActivity: true,
    challengeAlerts: true,
    milestoneAlerts: true,
    currency: "USD",
    reducedMotion: false,
    theme: "dark",
  },
  awarded: ["seed"],
};

export const money = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 ? 2 : 0,
  }).format(value);
export const currencySymbol = (currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? currency;
export const daysBetween = (from: string | Date, to: string | Date) =>
  Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / DAY);
export const goalBalance = (state: AppState, goalId: string) =>
  state.transactions
    .filter((t) => t.goalId === goalId)
    .reduce((sum, t) => sum + (t.kind === "contribution" ? t.amount : -t.amount), 0);
export const totalSaved = (state: AppState) =>
  state.goals.reduce((sum, g) => sum + goalBalance(state, g.id), 0);
export const periodTotal = (state: AppState, days: number) => {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);
  return state.transactions
    .filter((t) => new Date(`${t.date}T12:00:00`) >= cutoff)
    .reduce((s, t) => s + (t.kind === "contribution" ? t.amount : -t.amount), 0);
};
export const dailySeries = (state: AppState, days = 7) =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      value: state.transactions
        .filter((t) => t.date === key)
        .reduce((s, t) => s + (t.kind === "contribution" ? t.amount : -t.amount), 0),
    };
  });
export const savingsStreak = (state: AppState) => {
  const dates = new Set(
    state.transactions.filter((t) => t.kind === "contribution").map((t) => t.date),
  );
  let streak = 0;
  const cursor = new Date();
  if (!dates.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
export const weeklyStreak = (state: AppState) => {
  const weeks = new Set(
    state.transactions
      .filter((transaction) => transaction.kind === "contribution")
      .map((transaction) => {
        const date = new Date(`${transaction.date}T12:00:00`);
        const monday = new Date(date);
        const day = monday.getDay() || 7;
        monday.setDate(monday.getDate() - day + 1);
        return monday.toISOString().slice(0, 10);
      }),
  );
  let streak = 0;
  const cursor = new Date();
  const day = cursor.getDay() || 7;
  cursor.setDate(cursor.getDate() - day + 1);
  if (!weeks.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 7);
  while (weeks.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
};
export const levelFromXp = (xp: number) => Math.floor(xp / 250) + 1;
export const levelProgress = (xp: number) => ({
  current: xp % 250,
  needed: 250,
  percent: (xp % 250) / 2.5,
});
export const challengePercent = (challenge: Challenge, userId = "me") => {
  const progress = challenge.participants.find((p) => p.userId === userId)?.progress ?? 0;
  return Math.min(100, challenge.target ? Math.round((progress / challenge.target) * 100) : 0);
};
export const personFor = (state: AppState, id: string) =>
  id === "me"
    ? {
        id: "me",
        name: state.profile.name,
        username: state.profile.username,
        initials: state.profile.initials,
        color: "green",
        status: "friend" as FriendStatus,
        progress: Math.round(
          state.goals.reduce(
            (s, g) => s + Math.min(100, (goalBalance(state, g.id) / g.target) * 100),
            0,
          ) / Math.max(1, state.goals.length),
        ),
        streak: savingsStreak(state),
        xp: state.profile.xp,
      }
    : state.people.find((p) => p.id === id);

export type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "PERSON_ADD"; person: Person }
  | { type: "TRANSACTION_ADD"; transaction: Transaction }
  | { type: "TRANSACTION_UPDATE"; transaction: Transaction }
  | { type: "TRANSACTION_DELETE"; id: string }
  | { type: "GOAL_ADD"; goal: Goal }
  | { type: "GOAL_UPDATE"; goal: Goal }
  | { type: "GOAL_DELETE"; id: string }
  | { type: "CHALLENGE_ADD"; challenge: Challenge }
  | { type: "CHALLENGE_UPDATE"; challenge: Challenge }
  | { type: "CHALLENGE_JOIN"; id: string }
  | { type: "CHALLENGE_LEAVE"; id: string }
  | { type: "CHALLENGE_COMPLETE"; id: string }
  | { type: "CHALLENGE_PROGRESS"; id: string; amount: number }
  | { type: "CHALLENGE_INVITE"; id: string; userId: string }
  | { type: "CHALLENGE_INVITE_DECLINE"; id: string }
  | { type: "FRIEND_STATUS"; id: string; status: FriendStatus }
  | { type: "FEED_REACT"; id: string }
  | { type: "FEED_COMMENT"; id: string; text: string }
  | { type: "NOTIFICATION_READ"; id: string }
  | { type: "NOTIFICATIONS_READ_ALL" }
  | { type: "NOTIFICATION_DELETE"; id: string }
  | { type: "PROFILE_UPDATE"; profile: Partial<Profile> }
  | { type: "SETTINGS_UPDATE"; settings: Partial<Settings> }
  | { type: "RESET" };

const notify = (title: string, body: string, route: string, kind: string): AppNotification => ({
  id: uid("n"),
  title,
  body,
  route,
  kind,
  date: new Date().toISOString(),
  read: false,
});
const feedItem = (text: string, target?: string): FeedItem => ({
  id: uid("f"),
  userId: "me",
  text,
  target,
  date: new Date().toISOString(),
  reactions: [],
  comments: [],
});
export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "PERSON_ADD":
      return {
        ...state,
        people: state.people.some((person) => person.id === action.person.id)
          ? state.people.map((person) => (person.id === action.person.id ? action.person : person))
          : [action.person, ...state.people],
      };
    case "TRANSACTION_ADD": {
      const gain = action.transaction.kind === "contribution";
      const goal = state.goals.find((g) => g.id === action.transaction.goalId);
      const amountXp = gain
        ? Math.min(150, Math.max(10, Math.round(action.transaction.amount / 2)))
        : 0;
      const beforeBalance = goal ? goalBalance(state, goal.id) : 0;
      const afterBalance =
        beforeBalance +
        (action.transaction.kind === "contribution"
          ? action.transaction.amount
          : -action.transaction.amount);
      const milestones =
        gain && goal
          ? [25, 50, 75, 100].filter(
              (threshold) =>
                (beforeBalance / goal.target) * 100 < threshold &&
                (afterBalance / goal.target) * 100 >= threshold &&
                !state.awarded.includes(`milestone:${goal.id}:${threshold}`),
            )
          : [];
      const milestoneXp = milestones.length * 50;
      const signed = gain ? action.transaction.amount : -action.transaction.amount;
      const challenges = state.challenges.map((c) =>
        c.status === "active" &&
        c.type !== "no-spend" &&
        action.transaction.date >= c.startDate &&
        action.transaction.date <= c.endDate &&
        c.participants.some((p) => p.userId === "me")
          ? {
              ...c,
              participants: c.participants.map((p) =>
                p.userId === "me" ? { ...p, progress: Math.max(0, p.progress + signed) } : p,
              ),
            }
          : c,
      );
      return {
        ...state,
        challenges,
        transactions: [action.transaction, ...state.transactions],
        awarded: [
          ...state.awarded,
          ...milestones.map((threshold) => `milestone:${goal?.id}:${threshold}`),
        ],
        profile: {
          ...state.profile,
          xp: state.profile.xp + amountXp + milestoneXp,
          earnedBadges: milestones.includes(100)
            ? [...new Set([...state.profile.earnedBadges, "goal-getter"])]
            : state.profile.earnedBadges,
        },
        feed:
          gain && state.settings.friendActivity
            ? [
                feedItem(
                  `added ${money(action.transaction.amount, state.settings.currency)} to ${goal?.name ?? "a goal"}`,
                  `/goals/${goal?.id}`,
                ),
                ...state.feed,
              ]
            : state.feed,
        notifications: gain
          ? [
              ...milestones.map((threshold) =>
                notify(
                  `${threshold}% milestone`,
                  `${goal?.name} reached ${threshold}%. +50 XP`,
                  `/goals/${goal?.id}`,
                  "achievement",
                ),
              ),
              notify(
                "Savings added",
                `${money(action.transaction.amount, state.settings.currency)} was recorded in your simulated stash. +${amountXp} XP`,
                `/goals/${goal?.id}`,
                "saving",
              ),
              ...state.notifications,
            ]
          : state.notifications,
      };
    }
    case "TRANSACTION_UPDATE": {
      const old = state.transactions.find((t) => t.id === action.transaction.id);
      if (!old) return state;
      const oldSigned = old.kind === "contribution" ? old.amount : -old.amount;
      const newSigned =
        action.transaction.kind === "contribution"
          ? action.transaction.amount
          : -action.transaction.amount;
      const challenges = state.challenges.map((c) => {
        if (c.status !== "active" || c.type === "no-spend") return c;
        const oldApplies = old.date >= c.startDate && old.date <= c.endDate;
        const newApplies =
          action.transaction.date >= c.startDate && action.transaction.date <= c.endDate;
        const delta = (newApplies ? newSigned : 0) - (oldApplies ? oldSigned : 0);
        return {
          ...c,
          participants: c.participants.map((p) =>
            p.userId === "me" ? { ...p, progress: Math.max(0, p.progress + delta) } : p,
          ),
        };
      });
      return {
        ...state,
        challenges,
        transactions: state.transactions.map((t) =>
          t.id === action.transaction.id ? action.transaction : t,
        ),
      };
    }
    case "TRANSACTION_DELETE": {
      const old = state.transactions.find((t) => t.id === action.id);
      if (!old) return state;
      const signed = old.kind === "contribution" ? old.amount : -old.amount;
      const challenges = state.challenges.map((c) =>
        c.status === "active" &&
        c.type !== "no-spend" &&
        old.date >= c.startDate &&
        old.date <= c.endDate
          ? {
              ...c,
              participants: c.participants.map((p) =>
                p.userId === "me" ? { ...p, progress: Math.max(0, p.progress - signed) } : p,
              ),
            }
          : c,
      );
      return {
        ...state,
        challenges,
        transactions: state.transactions.filter((t) => t.id !== action.id),
      };
    }
    case "GOAL_ADD":
      return {
        ...state,
        goals: [action.goal, ...state.goals],
        profile: { ...state.profile, xp: state.profile.xp + 25 },
        notifications: [
          notify(
            "Goal created",
            `${action.goal.name} is ready for contributions. +25 XP`,
            `/goals/${action.goal.id}`,
            "goal",
          ),
          ...state.notifications,
        ],
      };
    case "GOAL_UPDATE": {
      const previous = state.goals.find((g) => g.id === action.goal.id);
      const newlyCompleted = previous?.status !== "completed" && action.goal.status === "completed";
      const award = `goal:${action.goal.id}`;
      const reward = newlyCompleted && !state.awarded.includes(award);
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.goal.id ? action.goal : g)),
        awarded: reward ? [...state.awarded, award] : state.awarded,
        profile: reward
          ? {
              ...state.profile,
              xp: state.profile.xp + 200,
              earnedBadges: [...new Set([...state.profile.earnedBadges, "goal-getter"])],
            }
          : state.profile,
        notifications: reward
          ? [
              notify(
                "Goal complete",
                `${action.goal.name} reached the finish line. +200 XP`,
                `/goals/${action.goal.id}`,
                "achievement",
              ),
              ...state.notifications,
            ]
          : state.notifications,
      };
    }
    case "GOAL_DELETE":
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.id),
        transactions: state.transactions.filter((t) => t.goalId !== action.id),
      };
    case "CHALLENGE_ADD":
      return {
        ...state,
        challenges: [action.challenge, ...state.challenges],
        profile: { ...state.profile, xp: state.profile.xp + 40 },
        notifications: [
          notify(
            "Challenge created",
            `${action.challenge.title} is live. +40 XP`,
            `/challenges/${action.challenge.id}`,
            "challenge",
          ),
          ...state.notifications,
        ],
      };
    case "CHALLENGE_UPDATE":
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === action.challenge.id ? action.challenge : c,
        ),
      };
    case "CHALLENGE_JOIN":
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === action.id && !c.participants.some((p) => p.userId === "me")
            ? {
                ...c,
                participants: [...c.participants, { userId: "me", progress: 0 }],
                invitedIds: c.invitedIds.filter((userId) => userId !== "me"),
              }
            : c,
        ),
        profile: { ...state.profile, xp: state.profile.xp + 15 },
      };
    case "CHALLENGE_LEAVE":
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === action.id
            ? { ...c, participants: c.participants.filter((p) => p.userId !== "me") }
            : c,
        ),
      };
    case "CHALLENGE_PROGRESS":
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === action.id
            ? {
                ...c,
                participants: c.participants.map((p) =>
                  p.userId === "me"
                    ? {
                        ...p,
                        progress: Math.min(c.target, Math.max(0, p.progress + action.amount)),
                      }
                    : p,
                ),
              }
            : c,
        ),
      };
    case "CHALLENGE_COMPLETE": {
      const challenge = state.challenges.find((c) => c.id === action.id);
      if (!challenge || challengePercent(challenge) < 100) return state;
      const award = `challenge:${action.id}`;
      if (state.awarded.includes(award)) return state;
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === action.id ? { ...c, status: "completed" } : c,
        ),
        awarded: [...state.awarded, award],
        profile: {
          ...state.profile,
          xp: state.profile.xp + 300,
          earnedBadges: [...new Set([...state.profile.earnedBadges, "challenge-champion"])],
        },
        feed: [
          feedItem(`completed ${challenge.title}`, `/challenges/${challenge.id}`),
          ...state.feed,
        ],
        notifications: [
          notify(
            "Challenge champion",
            `You completed ${challenge.title}. +300 XP`,
            `/challenges/${challenge.id}`,
            "achievement",
          ),
          ...state.notifications,
        ],
      };
    }
    case "CHALLENGE_INVITE":
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === action.id &&
          !c.invitedIds.includes(action.userId) &&
          !c.participants.some((p) => p.userId === action.userId)
            ? { ...c, invitedIds: [...c.invitedIds, action.userId] }
            : c,
        ),
      };
    case "CHALLENGE_INVITE_DECLINE":
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === action.id
            ? { ...c, invitedIds: c.invitedIds.filter((userId) => userId !== "me") }
            : c,
        ),
      };
    case "FRIEND_STATUS":
      return {
        ...state,
        people: state.people.map((p) => (p.id === action.id ? { ...p, status: action.status } : p)),
        notifications:
          action.status === "friend"
            ? [
                notify(
                  "Friend added",
                  `You and ${state.people.find((p) => p.id === action.id)?.name} are now connected.`,
                  `/friends/${action.id}`,
                  "friend",
                ),
                ...state.notifications,
              ]
            : state.notifications,
      };
    case "FEED_REACT":
      return {
        ...state,
        feed: state.feed.map((f) =>
          f.id === action.id
            ? {
                ...f,
                reactions: f.reactions.includes("me")
                  ? f.reactions.filter((x) => x !== "me")
                  : [...f.reactions, "me"],
              }
            : f,
        ),
      };
    case "FEED_COMMENT":
      return {
        ...state,
        feed: state.feed.map((f) =>
          f.id === action.id
            ? {
                ...f,
                comments: [
                  ...f.comments,
                  {
                    id: uid("cm"),
                    userId: "me",
                    text: action.text,
                    date: new Date().toISOString(),
                  },
                ],
              }
            : f,
        ),
      };
    case "NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };
    case "NOTIFICATIONS_READ_ALL":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case "NOTIFICATION_DELETE":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    case "PROFILE_UPDATE":
      return { ...state, profile: { ...state.profile, ...action.profile } };
    case "SETTINGS_UPDATE":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "RESET":
      return seedState;
  }
}

type StoreValue = { state: AppState; dispatch: React.Dispatch<Action> };
const Store = createContext<StoreValue | null>(null);
const STORAGE_KEY = "stashup-state-v2";
type StoreProviderProps = { children: React.ReactNode; userId?: string };
type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  initials: string;
  city: string;
  bio: string;
  avatar_path: string | null;
  banner_path: string | null;
  currency: string;
  private_progress: boolean;
  friend_activity: boolean;
  challenge_alerts: boolean;
  milestone_alerts: boolean;
  reduced_motion: boolean;
  theme: "light" | "dark";
  xp: number;
  earned_badges: string[];
};
type GoalRow = {
  id: string;
  name: string;
  target_amount_cents: number;
  deadline: string | null;
  status: GoalStatus;
  color: string;
  created_at: string;
};
type EntryRow = {
  id: string;
  goal_id: string;
  amount_cents: number;
  kind: Transaction["kind"];
  category: string;
  description: string;
  occurred_on: string;
  created_at: string;
};
type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  profiles?: ProfileRow;
};
type ChallengeRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target_amount_cents: number;
  starts_on: string;
  ends_on: string;
  status: "upcoming" | "active" | "completed";
};
type ParticipantRow = {
  challenge_id: string;
  user_id: string;
  status: "invited" | "active" | "declined" | "left";
  progress_percent: number;
};

async function loadAccountState(userId: string): Promise<AppState> {
  const client = requireSupabase();
  const [profileResult, goalsResult, entriesResult, friendshipsResult, challengesResult] =
    await Promise.all([
    client.from("profiles").select("*").eq("id", userId).single(),
    client.from("savings_goals").select("*").eq("user_id", userId).order("created_at"),
    client
      .from("savings_entries")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false }),
    client
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    client
      .from("challenges")
      .select("*")
      .or(`creator_id.eq.${userId},visibility.eq.public`)
  ]);
  if (profileResult.error) throw profileResult.error;
  if (goalsResult.error) throw goalsResult.error;
  if (entriesResult.error) throw entriesResult.error;
  if (friendshipsResult.error) throw friendshipsResult.error;
  if (challengesResult.error) throw challengesResult.error;

  const profile = profileResult.data as ProfileRow;
  const goals = (goalsResult.data ?? []) as GoalRow[];
  const entries = (entriesResult.data ?? []) as EntryRow[];
  const friendships = (friendshipsResult.data ?? []) as FriendshipRow[];
  const challenges = (challengesResult.data ?? []) as ChallengeRow[];

  const relatedUserIds = [
    ...new Set(
      friendships.map((friendship) =>
        friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id,
      ),
    ),
  ];
  const challengeIds = challenges.map((challenge) => challenge.id);
  const [peopleResult, participantResult] = await Promise.all([
    relatedUserIds.length
      ? client
          .from("profiles")
          .select("id, username, display_name, initials, city, xp")
          .in("id", relatedUserIds)
      : Promise.resolve({ data: [], error: null }),
    challengeIds.length
      ? client
          .from("challenge_participants")
          .select("challenge_id, user_id, status, progress_percent")
          .in("challenge_id", challengeIds)
          .in("status", ["invited", "active"])
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (peopleResult.error) throw peopleResult.error;
  if (participantResult.error) throw participantResult.error;

  const peopleById = new Map(
    ((peopleResult.data ?? []) as Array<{
      id: string;
      username: string;
      display_name: string;
      initials: string;
      xp: number;
    }>).map((person) => [person.id, person]),
  );
  const people: Person[] = friendships
    .filter((friendship) => friendship.status !== "cancelled" && friendship.status !== "declined")
    .map((friendship) => {
      const personId =
        friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id;
      const person = peopleById.get(personId);
      let status: FriendStatus = "none";
      if (friendship.status === "accepted") status = "friend";
      else if (friendship.requester_id === userId) status = "outgoing";
      else status = "incoming";
      return {
        id: personId,
        name: person?.display_name ?? "Stash user",
        username: person?.username ?? "stash_user",
        initials: person?.initials ?? "SU",
        color: "green",
        status,
        progress: 0,
        streak: 0,
        xp: person?.xp ?? 0,
      };
    });

  const participants = (participantResult.data ?? []) as ParticipantRow[];
  const cloudChallenges: Challenge[] = challenges.map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    type: challenge.type,
    target: Number(challenge.target_amount_cents) / 100,
    startDate: challenge.starts_on,
    endDate: challenge.ends_on,
    status: challenge.status,
    creatorId: challenge.creator_id,
    participants: participants
      .filter((participant) => participant.challenge_id === challenge.id)
      .map((participant) => ({
        userId: participant.user_id === userId ? "me" : participant.user_id,
        progress: Number(participant.progress_percent),
      })),
    invitedIds: participants
      .filter(
        (participant) =>
          participant.challenge_id === challenge.id && participant.status === "invited",
      )
      .map((participant) => (participant.user_id === userId ? "me" : participant.user_id)),
  }));
  if (cloudChallenges.length) {
    cloudChallenges.forEach((challenge) => {
      if (!challenge.participants.some((participant) => participant.userId === "me")) {
        challenge.participants = challenge.participants.map((participant) => ({
          ...participant,
          progress: participant.progress,
        }));
      }
    });
  }
  return {
    ...seedState,
    profile: {
      id: "me",
      name: profile.display_name,
      username: profile.username,
      initials: profile.initials,
      city: profile.city,
      avatar: profile.avatar_path ?? undefined,
      banner: profile.banner_path ?? undefined,
      bio: profile.bio,
      xp: profile.xp,
      earnedBadges: profile.earned_badges,
    },
    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      target: Number(goal.target_amount_cents) / 100,
      deadline: goal.deadline ?? new Date().toISOString().slice(0, 10),
      status: goal.status,
      color: goal.color,
      createdAt: goal.created_at,
    })),
    transactions: entries.map((entry) => ({
      id: entry.id,
      goalId: entry.goal_id,
      amount: Number(entry.amount_cents) / 100,
      kind: entry.kind,
      category: entry.category,
      description: entry.description,
      date: entry.occurred_on,
      createdAt: entry.created_at,
    })),
    challenges: cloudChallenges,
    people,
    feed: [],
    notifications: [],
    settings: {
      privateProgress: profile.private_progress,
      friendActivity: profile.friend_activity,
      challengeAlerts: profile.challenge_alerts,
      milestoneAlerts: profile.milestone_alerts,
      currency: profile.currency,
      reducedMotion: profile.reduced_motion,
      theme: profile.theme,
    },
    awarded: [],
  };
}

async function persistAccountAction(action: Action, state: AppState, userId: string) {
  const client = requireSupabase();
  const saveProfile = async () => {
    const { error } = await client
      .from("profiles")
      .update({
        username: state.profile.username,
        display_name: state.profile.name,
        initials: state.profile.initials,
        city: state.profile.city,
        bio: state.profile.bio ?? "",
        avatar_path: state.profile.avatar ?? null,
        banner_path: state.profile.banner ?? null,
        currency: state.settings.currency,
        private_progress: state.settings.privateProgress,
        friend_activity: state.settings.friendActivity,
        challenge_alerts: state.settings.challengeAlerts,
        milestone_alerts: state.settings.milestoneAlerts,
        reduced_motion: state.settings.reducedMotion,
        theme: state.settings.theme,
        xp: state.profile.xp,
        earned_badges: state.profile.earnedBadges,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) throw error;
  };
  if (action.type === "GOAL_ADD" || action.type === "GOAL_UPDATE") {
    const goal = action.goal;
    const { error } = await client.from("savings_goals").upsert(
      {
        id: goal.id,
        user_id: userId,
        name: goal.name,
        target_amount_cents: Math.round(goal.target * 100),
        deadline: goal.deadline || null,
        status: goal.status,
        color: goal.color,
        created_at: goal.createdAt,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  } else if (action.type === "GOAL_DELETE") {
    const { error } = await client
      .from("savings_goals")
      .delete()
      .eq("id", action.id)
      .eq("user_id", userId);
    if (error) throw error;
  } else if (action.type === "TRANSACTION_ADD" || action.type === "TRANSACTION_UPDATE") {
    const entry = action.transaction;
    const { error } = await client.from("savings_entries").upsert(
      {
        id: entry.id,
        user_id: userId,
        goal_id: entry.goalId,
        amount_cents: Math.round(entry.amount * 100),
        kind: entry.kind,
        category: entry.category,
        description: entry.description,
        occurred_on: entry.date,
        created_at: entry.createdAt,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  } else if (action.type === "TRANSACTION_DELETE") {
    const { error } = await client
      .from("savings_entries")
      .delete()
      .eq("id", action.id)
      .eq("user_id", userId);
    if (error) throw error;
  } else if (action.type === "FRIEND_STATUS") {
    const person = state.people.find((item) => item.id === action.id);
    const existing = await client
      .from("friendships")
      .select("id, requester_id, addressee_id")
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${action.id}),and(requester_id.eq.${action.id},addressee_id.eq.${userId})`)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (action.status === "outgoing") {
      if (existing.data) throw new Error("A friendship request already exists.");
      const { error } = await client.from("friendships").insert({
        requester_id: userId,
        addressee_id: action.id,
        status: "pending",
      });
      if (error) throw error;
    } else if (action.status === "friend") {
      if (!existing.data) throw new Error("That friend request no longer exists.");
      const { error } = await client
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", existing.data.id)
        .eq("addressee_id", userId);
      if (error) throw error;
    } else if (action.status === "none") {
      if (!existing.data) throw new Error("That friendship no longer exists.");
      const row = existing.data;
      if (row.requester_id === userId) {
        const { error } = await client
          .from("friendships")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", row.id)
          .eq("requester_id", userId);
        if (error) throw error;
      } else {
        const { error } = await client
          .from("friendships")
          .delete()
          .eq("id", row.id)
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
        if (error) throw error;
      }
    }
    if (person) void person;
  } else if (
    action.type === "CHALLENGE_ADD" ||
    action.type === "CHALLENGE_UPDATE"
  ) {
    const challenge = action.challenge;
    const { error } = await client.from("challenges").upsert(
      {
        id: challenge.id,
        creator_id: userId,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        target_amount_cents: Math.round(challenge.target * 100),
        starts_on: challenge.startDate,
        ends_on: challenge.endDate,
        status: challenge.status,
        visibility: "invite_only",
      },
      { onConflict: "id" },
    );
    if (error) throw error;
    if (action.type === "CHALLENGE_ADD") {
      const { error: participantError } = await client
        .from("challenge_participants")
        .upsert(
          {
            challenge_id: challenge.id,
            user_id: userId,
            status: "active",
            progress_percent: 0,
          },
          { onConflict: "challenge_id,user_id" },
        );
      if (participantError) throw participantError;
    }
  } else if (
    action.type === "CHALLENGE_JOIN" ||
    action.type === "CHALLENGE_INVITE_DECLINE"
  ) {
    if (action.type === "CHALLENGE_JOIN") {
      const { error } = await client.from("challenge_participants").upsert(
        {
          challenge_id: action.id,
          user_id: userId,
          status: "active",
          progress_percent: 0,
        },
        { onConflict: "challenge_id,user_id" },
      );
      if (error) throw error;
    } else {
      const { error } = await client
        .from("challenge_participants")
        .update({ status: "declined" })
        .eq("challenge_id", action.id)
        .eq("user_id", userId);
      if (error) throw error;
    }
  } else if (action.type === "CHALLENGE_LEAVE") {
    const { error } = await client
      .from("challenge_participants")
      .delete()
      .eq("challenge_id", action.id)
      .eq("user_id", userId);
    if (error) throw error;
  } else if (action.type === "CHALLENGE_INVITE") {
    const { error } = await client.from("challenge_participants").upsert(
      {
        challenge_id: action.id,
        user_id: action.userId,
        status: "invited",
        progress_percent: 0,
      },
      { onConflict: "challenge_id,user_id" },
    );
    if (error) throw error;
  } else if (action.type === "CHALLENGE_PROGRESS") {
    const challenge = state.challenges.find((item) => item.id === action.id);
    const participant = challenge?.participants.find((item) => item.userId === "me");
    const { error } = await client
      .from("challenge_participants")
      .update({ progress_percent: participant?.progress ?? 0 })
      .eq("challenge_id", action.id)
      .eq("user_id", userId);
    if (error) throw error;
  } else if (action.type === "CHALLENGE_COMPLETE") {
    const challenge = state.challenges.find((item) => item.id === action.id);
    if (challenge) {
      const { error: challengeError } = await client
        .from("challenges")
        .update({ status: "completed" })
        .eq("id", action.id)
        .eq("creator_id", userId);
      if (challengeError) throw challengeError;
    }
  }
  if (
    action.type.startsWith("GOAL_") ||
    action.type.startsWith("TRANSACTION_") ||
    action.type === "PROFILE_UPDATE" ||
    action.type === "SETTINGS_UPDATE"
  ) {
    await saveProfile();
  }
}

export function StoreProvider({ children, userId }: StoreProviderProps) {
  const [state, reducerDispatch] = useReducer(appReducer, seedState, (seed) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return seed;
      const parsed = JSON.parse(saved) as Partial<AppState>;
      return {
        ...seed,
        ...parsed,
        settings: { ...seed.settings, ...parsed.settings },
      };
    } catch {
      return seed;
    }
  });
  const stateRef = useRef(state);
  const [ready, setReady] = useState(!userId);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!userId) {
      setReady(true);
      setLoadError("");
      return;
    }
    let active = true;
    setReady(false);
    setLoadError("");
    void loadAccountState(userId)
      .then((accountState) => {
        if (!active) return;
        stateRef.current = accountState;
        reducerDispatch({ type: "HYDRATE", state: accountState });
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Could not load your account data.");
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    stateRef.current = state;
    if (!userId) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, userId]);

  const dispatch = useCallback<React.Dispatch<Action>>(
    (action) => {
      if (action.type === "HYDRATE") {
        stateRef.current = action.state;
        reducerDispatch(action);
        return;
      }
      const nextState = appReducer(stateRef.current, action);
      if (nextState === stateRef.current) return;
      stateRef.current = nextState;
      reducerDispatch(action);
      if (userId) {
        void persistAccountAction(action, nextState, userId).catch((error: unknown) => {
          window.dispatchEvent(
            new CustomEvent("stashup-toast", {
              detail: {
                message:
                  error instanceof Error ? `Couldn't sync changes: ${error.message}` : "Couldn't sync changes.",
                type: "error",
              },
            }),
          );
        });
      }
    },
    [userId],
  );
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  if (userId && !ready) return <div className="app-loading">Loading your stash…</div>;
  if (userId && loadError)
    return (
      <div className="app-loading" role="alert">
        <p>Couldn’t load your account data.</p>
        <p>{loadError}</p>
        <button className="secondary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  return <Store.Provider value={value}>{children}</Store.Provider>;
}
export function useStore() {
  const value = useContext(Store);
  if (!value) throw new Error("useStore must be inside StoreProvider");
  return value;
}
export function useMoney() {
  const { state } = useStore();
  return (value: number) => money(value, state.settings.currency);
}
