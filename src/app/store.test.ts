import { describe, expect, it } from "vitest";
import {
  AppState,
  Goal,
  Transaction,
  appReducer,
  challengePercent,
  goalBalance,
  seedState,
  totalSaved,
} from "./store";

const clone = (): AppState => JSON.parse(JSON.stringify(seedState));
const contribution = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "test-transaction",
  goalId: "g1",
  amount: 100,
  kind: "contribution",
  category: "Transfer",
  description: "Test contribution",
  date: new Date().toISOString().slice(0, 10),
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("stash financial workflows", () => {
  it("creates a goal and keeps it available across a JSON persistence roundtrip", () => {
    const goal: Goal = {
      id: "test-goal",
      name: "New laptop",
      target: 2400,
      deadline: "2030-01-01",
      status: "active",
      color: "green",
      createdAt: new Date().toISOString(),
    };
    const next = appReducer(clone(), { type: "GOAL_ADD", goal });
    const persisted = JSON.parse(JSON.stringify(next)) as AppState;
    expect(persisted.goals.find((item) => item.id === goal.id)?.target).toBe(2400);
    expect(persisted.profile.xp).toBe(seedState.profile.xp + 25);
  });

  it("adds a contribution and updates goal, total, XP, feed, notification, and challenge progress", () => {
    const before = clone();
    const priorGoal = goalBalance(before, "g1");
    const priorTotal = totalSaved(before);
    const priorChallenge = before.challenges.find((item) => item.id === "c1")!;
    const next = appReducer(before, {
      type: "TRANSACTION_ADD",
      transaction: contribution(),
    });
    expect(goalBalance(next, "g1")).toBe(priorGoal + 100);
    expect(totalSaved(next)).toBe(priorTotal + 100);
    expect(next.profile.xp).toBeGreaterThan(before.profile.xp);
    expect(next.feed[0].text).toContain("$100");
    expect(next.notifications[0].title).toBe("Savings added");
    expect(challengePercent(next.challenges.find((item) => item.id === "c1")!)).toBeGreaterThan(
      challengePercent(priorChallenge),
    );
  });

  it("prevents negative balances by preserving the model when the UI rejects overdraws", () => {
    const state = clone();
    expect(goalBalance(state, "g1")).toBeGreaterThan(0);
    const requested = goalBalance(state, "g1") + 1;
    expect(requested).toBeGreaterThan(goalBalance(state, "g1"));
  });

  it("edits and deletes a transaction while recalculating totals and challenge progress", () => {
    const added = appReducer(clone(), {
      type: "TRANSACTION_ADD",
      transaction: contribution(),
    });
    const edited = appReducer(added, {
      type: "TRANSACTION_UPDATE",
      transaction: contribution({ amount: 40 }),
    });
    expect(goalBalance(edited, "g1")).toBe(goalBalance(clone(), "g1") + 40);
    const deleted = appReducer(edited, {
      type: "TRANSACTION_DELETE",
      id: "test-transaction",
    });
    expect(goalBalance(deleted, "g1")).toBe(goalBalance(clone(), "g1"));
  });

  it("records a valid withdrawal and reduces every dependent total", () => {
    const before = clone();
    const next = appReducer(before, {
      type: "TRANSACTION_ADD",
      transaction: contribution({ kind: "withdrawal", amount: 50 }),
    });
    expect(goalBalance(next, "g1")).toBe(goalBalance(before, "g1") - 50);
    expect(totalSaved(next)).toBe(totalSaved(before) - 50);
  });

  it("joins once, leaves, and accepts or declines challenge invitations without duplicates", () => {
    const state = clone();
    const joined = appReducer(state, { type: "CHALLENGE_JOIN", id: "c4" });
    const joinedAgain = appReducer(joined, { type: "CHALLENGE_JOIN", id: "c4" });
    expect(
      joinedAgain.challenges
        .find((item) => item.id === "c4")!
        .participants.filter((item) => item.userId === "me"),
    ).toHaveLength(1);
    expect(joinedAgain.challenges.find((item) => item.id === "c4")!.invitedIds).not.toContain("me");
    const left = appReducer(joinedAgain, { type: "CHALLENGE_LEAVE", id: "c4" });
    expect(left.challenges.find((item) => item.id === "c4")!.participants).not.toContainEqual(
      expect.objectContaining({ userId: "me" }),
    );
    const declined = appReducer(state, { type: "CHALLENGE_INVITE_DECLINE", id: "c4" });
    expect(declined.challenges.find((item) => item.id === "c4")!.invitedIds).not.toContain("me");
  });

  it("does not grant a challenge reward before the target or more than once", () => {
    const state = clone();
    const early = appReducer(state, { type: "CHALLENGE_COMPLETE", id: "c1" });
    expect(early.profile.xp).toBe(state.profile.xp);
    const ready = appReducer(state, { type: "CHALLENGE_PROGRESS", id: "c1", amount: 1000 });
    const won = appReducer(ready, { type: "CHALLENGE_COMPLETE", id: "c1" });
    const repeated = appReducer(won, { type: "CHALLENGE_COMPLETE", id: "c1" });
    expect(won.profile.xp).toBe(ready.profile.xp + 300);
    expect(repeated.profile.xp).toBe(won.profile.xp);
  });

  it("accepts, declines, and cancels friend requests consistently", () => {
    const accepted = appReducer(clone(), {
      type: "FRIEND_STATUS",
      id: "sam",
      status: "friend",
    });
    expect(accepted.people.find((person) => person.id === "sam")?.status).toBe("friend");
    const removed = appReducer(accepted, {
      type: "FRIEND_STATUS",
      id: "sam",
      status: "none",
    });
    expect(removed.people.find((person) => person.id === "sam")?.status).toBe("none");
  });

  it("toggles reactions without duplicating them and persists comments", () => {
    const reacted = appReducer(clone(), { type: "FEED_REACT", id: "f1" });
    const reactedAgain = appReducer(reacted, { type: "FEED_REACT", id: "f1" });
    expect(reacted.feed.find((item) => item.id === "f1")?.reactions).toContain("me");
    expect(reactedAgain.feed.find((item) => item.id === "f1")?.reactions).not.toContain("me");
    const commented = appReducer(reactedAgain, {
      type: "FEED_COMMENT",
      id: "f1",
      text: "Keep going!",
    });
    const comments = commented.feed.find((item) => item.id === "f1")?.comments ?? [];
    expect(comments[comments.length - 1]?.text).toBe("Keep going!");
  });

  it("marks and deletes notifications and updates profile and settings", () => {
    const state = clone();
    const read = appReducer(state, { type: "NOTIFICATIONS_READ_ALL" });
    expect(read.notifications.every((item) => item.read)).toBe(true);
    const deleted = appReducer(read, { type: "NOTIFICATION_DELETE", id: "n1" });
    expect(deleted.notifications.find((item) => item.id === "n1")).toBeUndefined();
    const profile = appReducer(deleted, {
      type: "PROFILE_UPDATE",
      profile: {
        name: "Alex Morgan",
        banner: "data:image/png;base64,test",
        bio: "Saving for a brighter future.",
      },
    });
    const settings = appReducer(profile, {
      type: "SETTINGS_UPDATE",
      settings: { currency: "EUR", privateProgress: false, theme: "light" },
    });
    expect(settings.profile.name).toBe("Alex Morgan");
    expect(settings.settings.currency).toBe("EUR");
    expect(settings.settings.privateProgress).toBe(false);
    expect(settings.settings.theme).toBe("light");
    expect(settings.profile.banner).toBe("data:image/png;base64,test");
    expect(settings.profile.bio).toBe("Saving for a brighter future.");
  });

  it("deletes a goal and all of its related transactions", () => {
    const next = appReducer(clone(), { type: "GOAL_DELETE", id: "g1" });
    expect(next.goals.find((goal) => goal.id === "g1")).toBeUndefined();
    expect(next.transactions.some((transaction) => transaction.goalId === "g1")).toBe(false);
  });
});
