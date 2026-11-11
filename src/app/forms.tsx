import { FormEvent, useState } from "react";
import {
  Challenge,
  ChallengeType,
  Goal,
  GoalStatus,
  Transaction,
  currencySymbol,
  goalBalance,
  uid,
  useMoney,
  useStore,
} from "./store";
import { Icon, showToast } from "./components";

const today = () => new Date().toISOString().slice(0, 10);
const later = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
export function Sheet({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal form-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        {children}
      </section>
    </div>
  );
}
export function TransactionForm({
  onClose,
  goalId,
  existing,
  initialKind = "contribution",
}: {
  onClose: () => void;
  goalId?: string;
  existing?: Transaction;
  initialKind?: "contribution" | "withdrawal";
}) {
  const { state, dispatch } = useStore();
  const cash = useMoney();
  const symbol = currencySymbol(state.settings.currency);
  const [kind, setKind] = useState(existing?.kind ?? initialKind);
  const [goal, setGoal] = useState(
    existing?.goalId ?? goalId ?? state.goals.find((g) => g.status === "active")?.id ?? "",
  );
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [category, setCategory] = useState(existing?.category ?? "Transfer");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [date, setDate] = useState(existing?.date ?? today());
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const numeric = Number(amount);
    if (!goal) return setError("Choose a savings goal.");
    if (!numeric || numeric <= 0) return setError("Enter an amount greater than zero.");
    if (!description.trim()) return setError("Add a short description.");
    if (new Date(date) > new Date()) return setError("Transaction date cannot be in the future.");
    if (kind === "withdrawal" && numeric > goalBalance(state, goal))
      return setError("Withdrawal cannot exceed this goal's available balance.");
    const transaction: Transaction = {
      id: existing?.id ?? uid("t"),
      goalId: goal,
      amount: numeric,
      kind,
      category,
      description: description.trim(),
      date,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    dispatch({ type: existing ? "TRANSACTION_UPDATE" : "TRANSACTION_ADD", transaction });
    showToast(
      existing
        ? "Transaction updated."
        : kind === "contribution"
          ? "Simulated contribution recorded."
          : "Withdrawal recorded.",
    );
    onClose();
  };
  return (
    <Sheet onClose={onClose} title={existing ? "Edit transaction" : "Record transaction"}>
      <span className="modal-icon">
        <Icon name="wallet" />
      </span>
      <h2>{existing ? "Edit transaction" : "Record savings activity"}</h2>
      <p className="muted">This records a simulated transaction. No bank transfer occurs.</p>
      <form onSubmit={submit} noValidate>
        <div className="segmented form-tabs">
          <button
            type="button"
            className={kind === "contribution" ? "active" : ""}
            onClick={() => setKind("contribution")}
          >
            Contribution
          </button>
          <button
            type="button"
            className={kind === "withdrawal" ? "active" : ""}
            onClick={() => setKind("withdrawal")}
          >
            Withdrawal
          </button>
        </div>
        <label className="field">
          AMOUNT
          <div className="currency-input">
            <span>{symbol}</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              aria-label="Amount"
            />
          </div>
        </label>
        <label className="field">
          SAVINGS GOAL
          <select value={goal} onChange={(e) => setGoal(e.target.value)} required>
            <option value="">Select a goal</option>
            {state.goals
              .filter((g) => g.status !== "completed" || g.id === goal)
              .map((g) => (
                <option value={g.id} key={g.id}>
                  {g.name} — {cash(goalBalance(state, g.id))} available
                </option>
              ))}
          </select>
        </label>
        <div className="field-row">
          <label className="field">
            CATEGORY
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {[
                "Transfer",
                "Paycheck",
                "Round-up",
                "Side income",
                "Gift",
                "Coffee swap",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            DATE
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <label className="field">
          DESCRIPTION
          <input
            value={description}
            maxLength={80}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this for?"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary wide modal-primary" type="submit">
          {existing
            ? "Save changes"
            : kind === "contribution"
              ? "Add to stash"
              : "Record withdrawal"}
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </Sheet>
  );
}

export function GoalForm({ onClose, existing }: { onClose: () => void; existing?: Goal }) {
  const { state, dispatch } = useStore();
  const symbol = currencySymbol(state.settings.currency);
  const [name, setName] = useState(existing?.name ?? "");
  const [target, setTarget] = useState(existing?.target.toString() ?? "");
  const [deadline, setDeadline] = useState(existing?.deadline ?? later(90));
  const [status, setStatus] = useState<GoalStatus>(existing?.status ?? "active");
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(target);
    if (!name.trim()) return setError("Enter a goal name.");
    if (!amount || amount <= 0) return setError("Target must be greater than zero.");
    if (new Date(deadline) < new Date(today()))
      return setError("Target date cannot be in the past.");
    const goal: Goal = {
      id: existing?.id ?? uid("g"),
      name: name.trim(),
      target: amount,
      deadline,
      status,
      color:
        existing?.color ?? ["green", "violet", "blue", "orange"][Math.floor(Math.random() * 4)],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    dispatch({ type: existing ? "GOAL_UPDATE" : "GOAL_ADD", goal });
    showToast(existing ? "Goal updated." : "Goal created. +25 XP");
    onClose();
  };
  return (
    <Sheet onClose={onClose} title={existing ? "Edit goal" : "Create goal"}>
      <span className="modal-icon">
        <Icon name="target" />
      </span>
      <h2>{existing ? "Edit savings goal" : "Create a savings goal"}</h2>
      <p className="muted">Give your savings a clear purpose and deadline.</p>
      <form onSubmit={submit}>
        <label className="field">
          GOAL NAME
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. New computer"
          />
        </label>
        <label className="field">
          TARGET AMOUNT
          <div className="currency-input">
            <span>{symbol}</span>
            <input
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="2,500"
            />
          </div>
        </label>
        <label className="field">
          TARGET DATE
          <input
            type="date"
            min={today()}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
        {existing && (
          <label className="field">
            STATUS
            <select value={status} onChange={(e) => setStatus(e.target.value as GoalStatus)}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="primary wide modal-primary" type="submit">
          {existing ? "Save goal" : "Create goal"}
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </Sheet>
  );
}

export function ChallengeForm({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing?: Challenge;
}) {
  const { dispatch } = useStore();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [type, setType] = useState<ChallengeType>(existing?.type ?? "fixed");
  const [target, setTarget] = useState(existing?.target.toString() ?? "500");
  const [startDate, setStart] = useState(existing?.startDate ?? today());
  const [endDate, setEnd] = useState(existing?.endDate ?? later(30));
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const numeric = Number(target);
    if (!title.trim()) return setError("Enter a challenge name.");
    if (!description.trim()) return setError("Add a challenge description.");
    if (!numeric || numeric <= 0) return setError("Target must be greater than zero.");
    if (new Date(endDate) <= new Date(startDate))
      return setError("End date must be after the start date.");
    const challenge: Challenge = {
      id: existing?.id ?? uid("c"),
      title: title.trim(),
      description: description.trim(),
      type,
      target: numeric,
      startDate,
      endDate,
      status: existing?.status ?? (startDate > today() ? "upcoming" : "active"),
      creatorId: existing?.creatorId ?? "me",
      participants: existing?.participants ?? [{ userId: "me", progress: 0 }],
      invitedIds: existing?.invitedIds ?? [],
    };
    dispatch({ type: existing ? "CHALLENGE_UPDATE" : "CHALLENGE_ADD", challenge });
    showToast(existing ? "Challenge updated." : "Challenge created. +40 XP");
    onClose();
  };
  return (
    <Sheet onClose={onClose} title={existing ? "Edit challenge" : "Create challenge"}>
      <span className="modal-icon">
        <Icon name="trophy" />
      </span>
      <h2>{existing ? "Edit challenge" : "Create a challenge"}</h2>
      <p className="muted">Turn a savings habit into friendly competition.</p>
      <form onSubmit={submit}>
        <label className="field">
          CHALLENGE NAME
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Summer getaway"
          />
        </label>
        <label className="field">
          DESCRIPTION
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is the challenge?"
          />
        </label>
        <label className="field">
          TYPE
          <select value={type} onChange={(e) => setType(e.target.value as ChallengeType)}>
            <option value="fixed">Fixed savings target</option>
            <option value="no-spend">No-spend challenge</option>
            <option value="weekly">Weekly savings</option>
            <option value="percentage">Percentage-based</option>
            <option value="head-to-head">Head-to-head</option>
            <option value="group">Group savings</option>
          </select>
        </label>
        <label className="field">
          {type === "no-spend"
            ? "NO-SPEND DAYS"
            : type === "percentage"
              ? "TARGET PERCENT"
              : "TARGET AMOUNT"}
          <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>
        <div className="field-row">
          <label className="field">
            START
            <input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="field">
            END
            <input
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary wide modal-primary" type="submit">
          {existing ? "Save changes" : "Create challenge"}
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </Sheet>
  );
}
