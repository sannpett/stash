import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Avatar, ConfirmDialog, Empty, Header, Icon, Progress, showToast } from "./components";
import { ChallengeForm, GoalForm, Sheet, TransactionForm } from "./forms";
import {
  AppState,
  Challenge,
  Transaction,
  challengePercent,
  dailySeries,
  daysBetween,
  goalBalance,
  levelFromXp,
  levelProgress,
  periodTotal,
  personFor,
  savingsStreak,
  totalSaved,
  useMoney,
  useStore,
  weeklyStreak,
} from "./store";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
const relative = (value: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;
};
const statusLabel = (end: string) => {
  const days = daysBetween(new Date(), `${end}T23:59:59`);
  return days < 0 ? "Ended" : days === 0 ? "Ends today" : `${days} days left`;
};

export function Home() {
  const { state } = useStore();
  const cash = useMoney();
  const [transaction, setTransaction] = useState(false);
  const navigate = useNavigate();
  const total = totalSaved(state);
  const weekly = periodTotal(state, 7);
  const monthly = periodTotal(state, 30);
  const streak = savingsStreak(state);
  const active = state.challenges.filter(
    (c) => c.status === "active" && c.participants.some((p) => p.userId === "me"),
  );
  const goals = state.goals.filter((g) => g.status === "active");
  const primary = goals[0];
  const balance = primary ? goalBalance(state, primary.id) : 0;
  const progress = primary ? (balance / primary.target) * 100 : 0;
  const series = dailySeries(state);
  const max = Math.max(1, ...series.map((d) => Math.abs(d.value)));
  const previous = periodTotal(
    {
      ...state,
      transactions: state.transactions.filter((t) => {
        const age = daysBetween(t.date, new Date());
        return age >= 7 && age < 14;
      }),
    },
    30,
  );
  const growth = previous
    ? Math.round(((weekly - previous) / Math.abs(previous)) * 100)
    : weekly
      ? 100
      : 0;
  return (
    <main className="screen">
      <Header />
      <section className="greeting">
        <div>
          <p className="eyebrow">GOOD MORNING, {state.profile.name.split(" ")[0].toUpperCase()}</p>
          <h1>{streak > 0 ? "You're on a roll." : "Start your momentum."}</h1>
        </div>
        <Link to="/profile">
          <Avatar
            initials={state.profile.initials}
            color="green"
            size="lg"
            online
            src={state.profile.avatar}
          />
        </Link>
      </section>
      <section className="balance-card">
        <div className="balance-glow" />
        <div className="balance-top">
          <div>
            <p className="label">TOTAL STASH</p>
            <h2>{cash(total)}</h2>
          </div>
          <span className="growth">
            <span>↗</span> {growth}%
          </span>
        </div>
        {primary ? (
          <button className="goal-line goal-link" onClick={() => navigate(`/goals/${primary.id}`)}>
            <div>
              <span>{primary.name}</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <Progress value={progress} />
            <p>
              {cash(Math.max(0, primary.target - balance))} to go · Target{" "}
              {formatDate(primary.deadline)}
            </p>
          </button>
        ) : (
          <p className="muted">Create a goal to begin saving.</p>
        )}
        <button className="primary wide" onClick={() => setTransaction(true)} disabled={!primary}>
          <Icon name="plus" size={18} /> Add to stash
        </button>
        <p className="simulation-note">
          <Icon name="shield" size={12} /> Demo ledger only — no bank transfer occurs
        </p>
      </section>
      <section className="stat-grid">
        <button className="stat-card" onClick={() => navigate("/transactions")}>
          <span className="stat-icon fire">
            <Icon name="flame" />
          </span>
          <div>
            <strong>
              {streak} {streak === 1 ? "day" : "days"}
            </strong>
            <p>Saving streak</p>
          </div>
          <span className="mini-up">View history</span>
        </button>
        <button className="stat-card" onClick={() => navigate("/profile")}>
          <span className="stat-icon bolt">
            <Icon name="bolt" />
          </span>
          <div>
            <strong>{state.profile.xp.toLocaleString()} XP</strong>
            <p>Level {levelFromXp(state.profile.xp)}</p>
          </div>
          <div className="tiny-progress">
            <i style={{ width: `${levelProgress(state.profile.xp).percent}%` }} />
          </div>
        </button>
      </section>
      <section className="metric-strip">
        <div>
          <span>THIS WEEK</span>
          <strong>{cash(weekly)}</strong>
        </div>
        <div>
          <span>THIS MONTH</span>
          <strong>{cash(monthly)}</strong>
        </div>
        <div>
          <span>ACTIVE</span>
          <strong>{active.length} challenges</strong>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">LAST 7 DAYS</p>
            <h2>{cash(weekly)} net saved</h2>
          </div>
          <Link className="text-button" to="/transactions">
            History <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="chart-card">
          <div className="chart-y">
            <span>{cash(max)}</span>
            <span>{cash(max / 2)}</span>
            <span>$0</span>
          </div>
          <div className="bars">
            {series.map((item, i) => (
              <div className="bar-wrap" key={item.date}>
                <div
                  className={`bar ${item.value === max ? "active" : ""} ${item.value < 0 ? "negative" : ""}`}
                  style={{ height: `${Math.max(3, (Math.abs(item.value) / max) * 100)}%` }}
                >
                  {item.value === max && <b>{cash(item.value)}</b>}
                </div>
                <span>
                  {["S", "M", "T", "W", "T", "F", "S"][new Date(`${item.date}T12:00:00`).getDay()]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Your goals</h2>
          <Link className="text-button" to="/goals">
            Manage all <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="mini-goals">
          {goals.slice(0, 3).map((g) => {
            const b = goalBalance(state, g.id);
            return (
              <Link to={`/goals/${g.id}`} className="mini-goal" key={g.id}>
                <span className={`challenge-symbol ${g.color}`}>
                  <Icon name="target" />
                </span>
                <div>
                  <strong>{g.name}</strong>
                  <span>
                    {cash(b)} of {cash(g.target)}
                  </span>
                  <Progress value={(b / g.target) * 100} />
                </div>
                <b>{Math.round((b / g.target) * 100)}%</b>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Challenge pulse</h2>
          <Link className="text-button" to="/challenges">
            See all <Icon name="arrow" size={16} />
          </Link>
        </div>
        {active[0] ? (
          <ChallengePreview challenge={active[0]} state={state} />
        ) : (
          <Empty title="No active challenges" text="Join a challenge to compete with friends." />
        )}
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Friends are saving</h2>
          <Link className="text-button" to="/friends">
            View feed <Icon name="arrow" size={16} />
          </Link>
        </div>
        {state.feed[0] && <FeedCard id={state.feed[0].id} />}
      </section>
      {transaction && <TransactionForm onClose={() => setTransaction(false)} />}
    </main>
  );
}

function ChallengePreview({ challenge, state }: { challenge: Challenge; state: AppState }) {
  const me = challenge.participants.find((p) => p.userId === "me")?.progress ?? 0;
  const competitor = challenge.participants.find((p) => p.userId !== "me");
  const person = competitor ? personFor(state, competitor.userId) : null;
  return (
    <Link className="battle-card block-link" to={`/challenges/${challenge.id}`}>
      <div className="battle-head">
        <span className="live-pill">LIVE CHALLENGE</span>
        <span className="muted small">
          <Icon name="clock" size={14} /> {statusLabel(challenge.endDate)}
        </span>
      </div>
      <h3>{challenge.title}</h3>
      <p className="muted">{challenge.description}</p>
      <div className="versus">
        <div className="player">
          <Avatar
            initials={state.profile.initials}
            color="green"
            size="lg"
            src={state.profile.avatar}
          />
          <strong>You</strong>
          <b>{Math.round((me / challenge.target) * 100)}%</b>
        </div>
        <div className="vs-line">
          <span>VS</span>
        </div>
        <div className="player">
          <Avatar initials={person?.initials ?? "—"} color={person?.color ?? "blue"} size="lg" />
          <strong>{person?.name.split(" ")[0] ?? "Goal"}</strong>
          <b>{Math.round(((competitor?.progress ?? 0) / challenge.target) * 100)}%</b>
        </div>
      </div>
      <Progress value={challengePercent(challenge)} />
      <p className="battle-note">
        <Icon name="bolt" size={15} /> Keep contributing to climb the challenge ranking.
      </p>
    </Link>
  );
}

export function Goals() {
  const { state } = useStore();
  const cash = useMoney();
  const [create, setCreate] = useState(false);
  const [filter, setFilter] = useState("all");
  const list = state.goals.filter((g) => filter === "all" || g.status === filter);
  return (
    <main className="screen">
      <Header
        title="Savings goals"
        subtitle={`${state.goals.length} goals · ${cash(totalSaved(state))} saved`}
        back
        action={
          <button className="square-add" onClick={() => setCreate(true)} aria-label="Create goal">
            <Icon name="plus" />
          </button>
        }
      />
      <div className="segmented">
        {["all", "active", "paused", "completed"].map((f) => (
          <button className={filter === f ? "active" : ""} onClick={() => setFilter(f)} key={f}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="goal-grid">
          {list.map((g) => {
            const balance = goalBalance(state, g.id);
            const days = daysBetween(new Date(), `${g.deadline}T23:59:59`);
            const remaining = Math.max(0, g.target - balance);
            const daily = days > 0 ? remaining / days : remaining;
            return (
              <Link to={`/goals/${g.id}`} className="goal-card" key={g.id}>
                <div className="challenge-top">
                  <span className={`challenge-symbol ${g.color}`}>
                    <Icon name="target" />
                  </span>
                  <div className="challenge-info">
                    <span className="eyebrow">
                      {g.status} · {days < 0 ? "OVERDUE" : `${days} DAYS LEFT`}
                    </span>
                    <h3>{g.name}</h3>
                  </div>
                  <Icon name="chevron" className="chev" />
                </div>
                <div className="goal-value">
                  <strong>{cash(balance)}</strong>
                  <span>of {cash(g.target)}</span>
                </div>
                <Progress value={g.target ? (balance / g.target) * 100 : 0} />
                <div className="goal-meta">
                  <span>{cash(remaining)} remaining</span>
                  <span>
                    {days > 0
                      ? `${cash(daily)}/day needed`
                      : days < 0
                        ? "Target date passed"
                        : "Due today"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty
          title={`No ${filter === "all" ? "" : filter} goals`}
          text="Create a savings goal to start building progress."
          action={
            <button className="primary" onClick={() => setCreate(true)}>
              Create goal
            </button>
          }
        />
      )}{" "}
      {create && <GoalForm onClose={() => setCreate(false)} />}
    </main>
  );
}

export function GoalDetail() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const cash = useMoney();
  const navigate = useNavigate();
  const goal = state.goals.find((g) => g.id === id);
  const [transaction, setTransaction] = useState<"contribution" | "withdrawal" | null>(null);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction>();
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction>();
  if (!goal) return <NotFound />;
  const balance = goalBalance(state, goal.id);
  const progress = goal.target ? (balance / goal.target) * 100 : 0;
  const remaining = Math.max(0, goal.target - balance);
  const days = daysBetween(new Date(), `${goal.deadline}T23:59:59`);
  const history = state.transactions
    .filter((t) => t.goalId === goal.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const togglePause = () => {
    dispatch({
      type: "GOAL_UPDATE",
      goal: { ...goal, status: goal.status === "paused" ? "active" : "paused" },
    });
    showToast(goal.status === "paused" ? "Goal resumed." : "Goal paused.");
  };
  return (
    <main className="screen">
      <Header
        title={goal.name}
        subtitle={`${goal.status} goal`}
        back
        action={
          <button className="icon-button" onClick={() => setEdit(true)} aria-label="Edit goal">
            <Icon name="edit" />
          </button>
        }
      />
      <section className="goal-hero">
        <span className={`challenge-symbol ${goal.color}`}>
          <Icon name="target" />
        </span>
        <p className="label">CURRENT BALANCE</p>
        <h1>{cash(balance)}</h1>
        <p>of {cash(goal.target)} target</p>
        <Progress value={progress} />
        <div className="goal-hero-stats">
          <div>
            <span>PROGRESS</span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <div>
            <span>REMAINING</span>
            <strong>{cash(remaining)}</strong>
          </div>
          <div>
            <span>DUE</span>
            <strong>{days < 0 ? "Overdue" : days === 0 ? "Today" : `${days}d`}</strong>
          </div>
        </div>
      </section>
      <div className="action-grid">
        <button
          className="primary"
          disabled={goal.status !== "active"}
          onClick={() => setTransaction("contribution")}
        >
          <Icon name="plus" />
          Add money
        </button>
        <button
          className="secondary action-button"
          disabled={balance <= 0}
          onClick={() => setTransaction("withdrawal")}
        >
          <Icon name="wallet" />
          Withdraw
        </button>
      </div>
      <div className="management-row">
        <button onClick={togglePause}>
          <Icon name={goal.status === "paused" ? "play" : "pause"} />
          {goal.status === "paused" ? "Resume" : "Pause"}
        </button>
        {balance >= goal.target && goal.status !== "completed" && (
          <button
            onClick={() => {
              dispatch({ type: "GOAL_UPDATE", goal: { ...goal, status: "completed" } });
              showToast("Goal completed!");
            }}
          >
            <Icon name="check" />
            Complete
          </button>
        )}
        <button className="danger-text" onClick={() => setConfirm(true)}>
          <Icon name="trash" />
          Delete
        </button>
      </div>
      <section className="section">
        <div className="section-head">
          <h2>Contribution history</h2>
          <Link className="text-button" to={`/transactions?goal=${goal.id}`}>
            Filter all <Icon name="arrow" size={16} />
          </Link>
        </div>
        {history.length ? (
          <div className="transaction-list">
            {history.map((t) => (
              <TransactionRow
                transaction={t}
                key={t.id}
                onEdit={() => setEditingTransaction(t)}
                onDelete={() => setDeleteTransaction(t)}
              />
            ))}
          </div>
        ) : (
          <Empty
            icon="wallet"
            title="No activity yet"
            text="Your contributions and withdrawals will appear here."
          />
        )}
      </section>
      {transaction && (
        <TransactionForm
          goalId={goal.id}
          initialKind={transaction}
          onClose={() => setTransaction(null)}
        />
      )}{" "}
      {editingTransaction && (
        <TransactionForm
          existing={editingTransaction}
          onClose={() => setEditingTransaction(undefined)}
        />
      )}{" "}
      {edit && <GoalForm existing={goal} onClose={() => setEdit(false)} />}{" "}
      {confirm && (
        <ConfirmDialog
          title="Delete this goal?"
          text="This permanently removes the goal and its complete transaction history. This cannot be undone."
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            dispatch({ type: "GOAL_DELETE", id: goal.id });
            showToast("Goal and related transactions deleted.");
            navigate("/goals");
          }}
        />
      )}
      {deleteTransaction && (
        <ConfirmDialog
          title="Delete transaction?"
          text="Dashboard totals and goal progress will be recalculated."
          onClose={() => setDeleteTransaction(undefined)}
          onConfirm={() => {
            dispatch({ type: "TRANSACTION_DELETE", id: deleteTransaction.id });
            setDeleteTransaction(undefined);
            showToast("Transaction deleted.");
          }}
        />
      )}
    </main>
  );
}

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cash = useMoney();
  return (
    <div className="transaction-row">
      <span className={`transaction-icon ${transaction.kind}`}>
        <Icon name={transaction.kind === "contribution" ? "plus" : "wallet"} />
      </span>
      <div>
        <strong>{transaction.description}</strong>
        <span>
          {transaction.category} · {formatDate(transaction.date)}
        </span>
      </div>
      <b className={transaction.kind}>
        {transaction.kind === "contribution" ? "+" : "−"}
        {cash(transaction.amount)}
      </b>
      <div className="row-actions">
        <button onClick={onEdit} aria-label="Edit transaction">
          <Icon name="edit" />
        </button>
        <button onClick={onDelete} aria-label="Delete transaction">
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}

export function Transactions() {
  const { state, dispatch } = useStore();
  const cash = useMoney();
  const [searchParams, setSearchParams] = useSearchParams();
  const [create, setCreate] = useState(false);
  const [editing, setEditing] = useState<Transaction>();
  const [deleting, setDeleting] = useState<Transaction>();
  const goal = searchParams.get("goal") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const range = searchParams.get("range") ?? "all";
  const cutoff = range === "7" ? 7 : range === "30" ? 30 : Infinity;
  const rows = state.transactions
    .filter(
      (t) =>
        (goal === "all" || t.goalId === goal) &&
        (category === "all" || t.category === category) &&
        daysBetween(t.date, new Date()) <= cutoff,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const categories = [...new Set(state.transactions.map((t) => t.category))];
  return (
    <main className="screen">
      <Header
        title="Transaction history"
        subtitle="Simulated savings ledger"
        back
        action={
          <button className="square-add" onClick={() => setCreate(true)}>
            <Icon name="plus" />
          </button>
        }
      />
      <div className="filter-grid">
        <select
          aria-label="Goal filter"
          value={goal}
          onChange={(e) => {
            searchParams.set("goal", e.target.value);
            setSearchParams(searchParams);
          }}
        >
          <option value="all">All goals</option>
          {state.goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Category filter"
          value={category}
          onChange={(e) => {
            searchParams.set("category", e.target.value);
            setSearchParams(searchParams);
          }}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Date range"
          value={range}
          onChange={(e) => {
            searchParams.set("range", e.target.value);
            setSearchParams(searchParams);
          }}
        >
          <option value="all">All dates</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>
      <div className="ledger-summary">
        <div>
          <span>NET TOTAL</span>
          <strong>
            {cash(rows.reduce((s, t) => s + (t.kind === "contribution" ? t.amount : -t.amount), 0))}
          </strong>
        </div>
        <div>
          <span>TRANSACTIONS</span>
          <strong>{rows.length}</strong>
        </div>
      </div>
      {rows.length ? (
        <div className="transaction-list">
          {rows.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              onEdit={() => setEditing(t)}
              onDelete={() => setDeleting(t)}
            />
          ))}
        </div>
      ) : (
        <Empty
          icon="filter"
          title="No matching transactions"
          text="Adjust the filters or record a new transaction."
        />
      )}
      {create && <TransactionForm onClose={() => setCreate(false)} />}{" "}
      {editing && <TransactionForm existing={editing} onClose={() => setEditing(undefined)} />}{" "}
      {deleting && (
        <ConfirmDialog
          title="Delete transaction?"
          text="All related metrics will update immediately."
          onClose={() => setDeleting(undefined)}
          onConfirm={() => {
            dispatch({ type: "TRANSACTION_DELETE", id: deleting.id });
            setDeleting(undefined);
            showToast("Transaction deleted.");
          }}
        />
      )}
    </main>
  );
}

export function Challenges() {
  const { state } = useStore();
  const [filter, setFilter] = useState("active");
  const [create, setCreate] = useState(false);
  const list = state.challenges.filter((c) =>
    filter === "discover"
      ? !c.participants.some((p) => p.userId === "me") && c.status !== "completed"
      : filter === "completed"
        ? c.status === "completed"
        : c.participants.some((p) => p.userId === "me") && c.status !== "completed",
  );
  return (
    <main className="screen">
      <Header title="Challenges" subtitle="Compete. Save. Win together." />
      <div className="hero-split">
        <div>
          <span className="live-pill">WEEKLY SPOTLIGHT</span>
          <h2>
            Small moves.
            <br />
            Big momentum.
          </h2>
          <p>Compete on progress—not private balances.</p>
        </div>
        <span className="hero-trophy">
          <Icon name="trophy" size={42} />
        </span>
      </div>
      <div className="segmented">
        {[
          ["active", "Active"],
          ["discover", "Discover"],
          ["completed", "Completed"],
        ].map(([id, label]) => (
          <button className={filter === id ? "active" : ""} onClick={() => setFilter(id)} key={id}>
            {label}
          </button>
        ))}
      </div>
      <section className="section compact">
        <div className="section-head">
          <h2>
            {filter === "discover"
              ? "Available challenges"
              : filter === "completed"
                ? "Past challenges"
                : "Your challenges"}
          </h2>
          <button
            className="square-add"
            onClick={() => setCreate(true)}
            aria-label="Create challenge"
          >
            <Icon name="plus" />
          </button>
        </div>
        {list.length ? (
          <div className="challenge-list">
            {list.map((c) => (
              <ChallengeCard challenge={c} key={c.id} />
            ))}
          </div>
        ) : (
          <Empty
            icon="trophy"
            title="Nothing here yet"
            text={
              filter === "discover"
                ? "You're already in every available challenge."
                : "Create or join a challenge to get started."
            }
          />
        )}
      </section>
      {filter === "active" && (
        <section className="comeback">
          <span className="comeback-icon">
            <Icon name="bolt" />
          </span>
          <div>
            <span className="eyebrow">COMEBACK BOOST</span>
            <h3>Consistency beats perfection</h3>
            <p>Add a contribution to an active goal today to build challenge progress and XP.</p>
            <Link to="/goals">Choose a goal</Link>
          </div>
        </section>
      )}
      {create && <ChallengeForm onClose={() => setCreate(false)} />}
    </main>
  );
}
function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { state } = useStore();
  const cash = useMoney();
  const joined = challenge.participants.some((p) => p.userId === "me");
  const progress = challengePercent(challenge);
  return (
    <Link to={`/challenges/${challenge.id}`} className="challenge-card">
      <div className="challenge-top">
        <span
          className={`challenge-symbol ${challenge.type === "group" ? "blue" : challenge.type === "no-spend" ? "violet" : "green"}`}
        >
          <Icon
            name={
              challenge.type === "group"
                ? "users"
                : challenge.type === "no-spend"
                  ? "shield"
                  : "bolt"
            }
          />
        </span>
        <div className="challenge-info">
          <span className="eyebrow">
            {challenge.type.replace(/-/g, " ")} · {challenge.status}
          </span>
          <h3>{challenge.title}</h3>
        </div>
        <Icon name="chevron" className="chev" />
      </div>
      {joined && (
        <>
          <div className="challenge-numbers">
            <strong>
              {cash(challenge.participants.find((p) => p.userId === "me")?.progress ?? 0)}{" "}
              <span>
                of{" "}
                {challenge.type === "no-spend"
                  ? `${challenge.target} days`
                  : cash(challenge.target)}
              </span>
            </strong>
            <b>{progress}%</b>
          </div>
          <Progress value={progress} />
        </>
      )}
      <div className="challenge-foot">
        <div className="avatar-stack">
          {challenge.participants.slice(0, 3).map((p) => {
            const person = personFor(state, p.userId);
            return (
              <Avatar
                key={p.userId}
                initials={person?.initials ?? "?"}
                color={person?.color ?? "green"}
                size="sm"
                src={person?.id === "me" ? state.profile.avatar : undefined}
              />
            );
          })}
          <span>+{Math.max(0, challenge.participants.length - 3)}</span>
        </div>
        <span>
          <Icon name="clock" size={15} />
          {statusLabel(challenge.endDate)}
        </span>
      </div>
    </Link>
  );
}

export function ChallengeDetail() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const cash = useMoney();
  const challenge = state.challenges.find((c) => c.id === id);
  const [edit, setEdit] = useState(false);
  const [invite, setInvite] = useState(false);
  const [leave, setLeave] = useState(false);
  if (!challenge) return <NotFound />;
  const joined = challenge.participants.some((p) => p.userId === "me");
  const progress = challengePercent(challenge);
  const rankings = [...challenge.participants].sort((a, b) => b.progress - a.progress);
  const canComplete = progress >= 100 && challenge.status !== "completed";
  const join = () => {
    dispatch({ type: "CHALLENGE_JOIN", id: challenge.id });
    showToast("Challenge joined. +15 XP");
  };
  const invited = challenge.invitedIds.includes("me");
  return (
    <main className="screen">
      <Header
        title={challenge.title}
        subtitle={`${challenge.type.replace(/-/g, " ")} challenge`}
        back
        action={
          challenge.creatorId === "me" ? (
            <button className="icon-button" onClick={() => setEdit(true)}>
              <Icon name="edit" />
            </button>
          ) : undefined
        }
      />
      <section className="challenge-hero">
        <span className="live-pill">{challenge.status.toUpperCase()}</span>
        <h1>{progress}%</h1>
        <p>Your challenge progress</p>
        <Progress value={progress} />
        <div className="goal-hero-stats">
          <div>
            <span>TARGET</span>
            <strong>
              {challenge.type === "no-spend" ? `${challenge.target} days` : cash(challenge.target)}
            </strong>
          </div>
          <div>
            <span>ENDS</span>
            <strong>{formatDate(challenge.endDate)}</strong>
          </div>
          <div>
            <span>PLAYERS</span>
            <strong>{challenge.participants.length}</strong>
          </div>
        </div>
      </section>
      <p className="detail-description">{challenge.description}</p>
      {joined ? (
        <>
          <div className="action-grid">
            <button className="primary" onClick={() => setInvite(true)}>
              <Icon name="users" />
              Invite friends
            </button>
            {canComplete ? (
              <button
                className="secondary action-button"
                onClick={() => {
                  dispatch({ type: "CHALLENGE_COMPLETE", id: challenge.id });
                  showToast("Challenge complete! +300 XP");
                }}
              >
                <Icon name="trophy" />
                Claim win
              </button>
            ) : (
              <button className="secondary action-button" onClick={() => setLeave(true)}>
                <Icon name="x" />
                Leave
              </button>
            )}
          </div>
          {challenge.type === "no-spend" && challenge.status === "active" && progress < 100 && (
            <button
              className="wide log-day"
              onClick={() => {
                dispatch({ type: "CHALLENGE_PROGRESS", id: challenge.id, amount: 1 });
                showToast("No-spend day logged.");
              }}
            >
              <Icon name="check" />
              Log a completed no-spend day
            </button>
          )}
        </>
      ) : invited ? (
        <div className="action-grid">
          <button className="primary" onClick={join}>
            <Icon name="check" />
            Accept invite
          </button>
          <button
            className="secondary action-button"
            onClick={() => {
              dispatch({ type: "CHALLENGE_INVITE_DECLINE", id: challenge.id });
              showToast("Invitation declined.");
            }}
          >
            <Icon name="x" />
            Decline
          </button>
        </div>
      ) : (
        <button className="primary wide" disabled={challenge.status === "completed"} onClick={join}>
          <Icon name="plus" />
          Join challenge
        </button>
      )}
      <section className="section">
        <div className="section-head">
          <h2>Leaderboard</h2>
          <span className="muted small">By target progress</span>
        </div>
        <div className="rank-list">
          {rankings.map((p, index) => {
            const person = personFor(state, p.userId);
            const pct = Math.min(100, Math.round((p.progress / challenge.target) * 100));
            return (
              <div className={`rank-row ${p.userId === "me" ? "you-row" : ""}`} key={p.userId}>
                <b>{index + 1}</b>
                <Avatar
                  initials={person?.initials ?? "?"}
                  color={person?.color ?? "green"}
                  size="md"
                  src={person?.id === "me" ? state.profile.avatar : undefined}
                />
                <div>
                  <strong>
                    {person?.name}
                    {p.userId === "me" ? " (You)" : ""}
                  </strong>
                  <span>{person?.streak} day streak</span>
                </div>
                <div className="rank-progress">
                  <strong>{pct}%</strong>
                  <Progress value={pct} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {edit && <ChallengeForm existing={challenge} onClose={() => setEdit(false)} />}{" "}
      {invite && <InviteSheet challenge={challenge} onClose={() => setInvite(false)} />}{" "}
      {leave && (
        <ConfirmDialog
          title="Leave this challenge?"
          text="Your challenge progress will be removed. You can rejoin while it remains open."
          confirmLabel="Leave challenge"
          onClose={() => setLeave(false)}
          onConfirm={() => {
            dispatch({ type: "CHALLENGE_LEAVE", id: challenge.id });
            setLeave(false);
            showToast("You left the challenge.");
          }}
        />
      )}
    </main>
  );
}
function InviteSheet({ challenge, onClose }: { challenge: Challenge; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const friends = state.people.filter((p) => p.status === "friend");
  return (
    <Sheet title="Invite friends" onClose={onClose}>
      <span className="modal-icon">
        <Icon name="users" />
      </span>
      <h2>Invite your crew</h2>
      <p className="muted">Friends can accept from their challenge invitations.</p>
      <div className="friends-list sheet-list">
        {friends.map((p) => {
          const invited =
            challenge.invitedIds.includes(p.id) ||
            challenge.participants.some((x) => x.userId === p.id);
          return (
            <div className="friend-row" key={p.id}>
              <Avatar initials={p.initials} color={p.color} size="md" />
              <div>
                <strong>{p.name}</strong>
                <span>@{p.username}</span>
              </div>
              <button
                className={invited ? "sent" : ""}
                disabled={invited}
                onClick={() => {
                  dispatch({ type: "CHALLENGE_INVITE", id: challenge.id, userId: p.id });
                  showToast(`Invitation sent to ${p.name}.`);
                }}
              >
                {invited ? "Invited" : "Invite"}
              </button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

export function Leaderboard() {
  const { state } = useStore();
  const [period, setPeriod] = useState("weekly");
  const [scope, setScope] = useState("friends");
  const [challengeId, setChallengeId] = useState(
    state.challenges.find((c) => c.status === "active")?.id ?? "",
  );
  let people = [
    personFor(state, "me"),
    ...state.people.filter((p) => scope === "all" || p.status === "friend"),
  ].filter(Boolean);
  if (period === "challenge") {
    const challenge = state.challenges.find((c) => c.id === challengeId);
    people =
      challenge?.participants.map((p) => ({
        ...personFor(state, p.userId)!,
        progress: Math.min(100, Math.round((p.progress / challenge.target) * 100)),
      })) ?? [];
  } else {
    const factor = period === "monthly" ? 1.05 : period === "alltime" ? 1.1 : 1;
    people = people.map((p) => ({
      ...p!,
      progress: Math.min(100, Math.round(p!.progress * factor)),
    }));
  }
  const sorted = [...people].sort((a, b) => b!.progress - a!.progress);
  const ranks = sorted.map((p, i) => ({
    person: p!,
    rank: i === 0 ? 1 : sorted[i - 1]!.progress === p!.progress ? 0 : i + 1,
  }));
  let lastRank = 1;
  ranks.forEach((r) => {
    if (r.rank === 0) r.rank = lastRank;
    else lastRank = r.rank;
  });
  const me = ranks.find((r) => r.person.id === "me");
  return (
    <main className="screen">
      <Header title="Leaderboard" subtitle="Progress beats balance." />
      <div className="segmented">
        {[
          ["weekly", "Weekly"],
          ["monthly", "Monthly"],
          ["alltime", "All-time"],
          ["challenge", "Challenge"],
        ].map(([id, label]) => (
          <button className={period === id ? "active" : ""} onClick={() => setPeriod(id)} key={id}>
            {label}
          </button>
        ))}
      </div>
      <div className="leader-controls">
        <div className="segmented mini-segment">
          <button
            className={scope === "friends" ? "active" : ""}
            onClick={() => setScope("friends")}
          >
            Friends
          </button>
          <button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>
            All
          </button>
        </div>
        {period === "challenge" && (
          <select value={challengeId} onChange={(e) => setChallengeId(e.target.value)}>
            {state.challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>
      <section className="league-title">
        <div>
          <span className="eyebrow">YOUR POSITION</span>
          <h2>Momentum League</h2>
          <p>{me ? `You're ranked #${me.rank} of ${ranks.length}` : "Join to rank"}</p>
        </div>
        <span className="league-badge">
          <Icon name="medal" size={30} />
        </span>
      </section>
      <section className="rank-list">
        {ranks.map(({ person, rank }) => (
          <Link
            to={person.id === "me" ? "/profile" : `/friends/${person.id}`}
            className={`rank-row ${person.id === "me" ? "you-row" : ""}`}
            key={person.id}
          >
            <b>{rank}</b>
            <Avatar
              initials={person.initials}
              color={person.color}
              size="md"
              src={person.id === "me" ? state.profile.avatar : undefined}
            />
            <div>
              <strong>
                {person.name}
                {person.id === "me" ? " (You)" : ""}
              </strong>
              <span>
                <Icon name="flame" size={13} />
                {person.streak} day streak
              </span>
            </div>
            <div className="rank-progress">
              <strong>{person.progress}%</strong>
              <Progress value={person.progress} />
            </div>
          </Link>
        ))}
      </section>
      <div className="rank-insight">
        <Icon name="shield" />
        <p>
          <strong>Fair, privacy-first rankings</strong>
          <br />
          <span>Positions use goal percentages and consistency, never private balances.</span>
        </p>
      </div>
    </main>
  );
}

export function Friends() {
  const { state, dispatch } = useStore();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") ?? "activity";
  const [query, setQuery] = useState("");
  const feed = state.feed.filter(
    (f) =>
      f.userId === "me" || state.people.some((p) => p.id === f.userId && p.status === "friend"),
  );
  const setView = (v: string) => setParams({ view: v });
  return (
    <main className="screen">
      <Header title="Friends" subtitle="Better habits, built together." />
      <div className="social-summary">
        <div>
          <Avatar
            initials={state.profile.initials}
            color="green"
            size="lg"
            src={state.profile.avatar}
          />
          <div>
            <strong>{state.people.filter((p) => p.status === "friend").length} friends</strong>
            <span>
              {state.people.filter((p) => p.status === "incoming").length} pending request
            </span>
          </div>
        </div>
        <button onClick={() => setView("add")}>
          <Icon name="plus" size={17} />
          Invite
        </button>
      </div>
      <div className="segmented">
        <button className={view === "activity" ? "active" : ""} onClick={() => setView("activity")}>
          Activity
        </button>
        <button className={view === "people" ? "active" : ""} onClick={() => setView("people")}>
          My friends
        </button>
        <button className={view === "requests" ? "active" : ""} onClick={() => setView("requests")}>
          Requests
        </button>
        <button className={view === "add" ? "active" : ""} onClick={() => setView("add")}>
          Add
        </button>
      </div>
      {view === "activity" &&
        (feed.length ? (
          <section className="activity-list">
            {feed.map((f) => (
              <FeedCard id={f.id} key={f.id} />
            ))}
          </section>
        ) : (
          <Empty
            icon="users"
            title="No activity yet"
            text="Add friends to build your social savings feed."
          />
        ))}
      {view === "people" && (
        <div className="friends-list">
          {state.people
            .filter((p) => p.status === "friend")
            .map((p) => (
              <FriendRow id={p.id} key={p.id} />
            ))}
        </div>
      )}
      {view === "requests" && (
        <div className="friends-list">
          {state.people
            .filter((p) => p.status === "incoming" || p.status === "outgoing")
            .map((p) => (
              <div className="friend-row" key={p.id}>
                <Avatar initials={p.initials} color={p.color} size="lg" />
                <div>
                  <strong>{p.name}</strong>
                  <span>{p.status === "incoming" ? "Wants to connect" : "Request sent"}</span>
                </div>
                {p.status === "incoming" ? (
                  <div className="request-actions">
                    <button
                      onClick={() => {
                        dispatch({ type: "FRIEND_STATUS", id: p.id, status: "friend" });
                        showToast(`${p.name} is now a friend.`);
                      }}
                    >
                      <Icon name="check" />
                    </button>
                    <button
                      onClick={() => dispatch({ type: "FRIEND_STATUS", id: p.id, status: "none" })}
                    >
                      <Icon name="x" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      dispatch({ type: "FRIEND_STATUS", id: p.id, status: "none" });
                      showToast("Request cancelled.");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          {!state.people.some((p) => p.status === "incoming" || p.status === "outgoing") && (
            <Empty icon="users" title="No pending requests" text="You're all caught up." />
          )}
        </div>
      )}
      {view === "add" && (
        <section className="add-friends">
          <div className="search">
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search demo users by name or username"
              aria-label="Search users"
            />
          </div>
          <div className="invite-link">
            <span>
              <Icon name="share" />
            </span>
            <div>
              <strong>Share your demo invite link</strong>
              <p>Invite a friend to try the prototype</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText("https://stash.demo/invite/alex");
                showToast("Invite link copied.");
              }}
            >
              Copy
            </button>
          </div>
          <h3>Demo users</h3>
          {state.people
            .filter((p) => `${p.name} ${p.username}`.toLowerCase().includes(query.toLowerCase()))
            .map((p) => (
              <FriendRow id={p.id} key={p.id} />
            ))}
        </section>
      )}
      <div className="privacy-note">
        <Icon name="lock" />
        <div>
          <strong>Your money, your rules</strong>
          <p>
            Friends see percentages and achievements—never balances.{" "}
            <Link to="/settings">Privacy settings</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
function FriendRow({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const person = state.people.find((p) => p.id === id);
  if (!person) return null;
  return (
    <div className="friend-row">
      <Link to={`/friends/${id}`}>
        <Avatar
          initials={person.initials}
          color={person.color}
          size="lg"
          online={person.status === "friend"}
        />
      </Link>
      <Link to={`/friends/${id}`} className="friend-copy">
        <strong>{person.name}</strong>
        <span>
          @{person.username} · {person.streak} day streak
        </span>
      </Link>
      {person.status === "none" ? (
        <button
          onClick={() => {
            dispatch({ type: "FRIEND_STATUS", id, status: "outgoing" });
            showToast("Friend request sent.");
          }}
        >
          Add
        </button>
      ) : person.status === "outgoing" ? (
        <button
          className="sent"
          onClick={() => dispatch({ type: "FRIEND_STATUS", id, status: "none" })}
        >
          Cancel
        </button>
      ) : person.status === "incoming" ? (
        <button onClick={() => dispatch({ type: "FRIEND_STATUS", id, status: "friend" })}>
          Accept
        </button>
      ) : (
        <Link className="row-chevron" to={`/friends/${id}`}>
          <Icon name="chevron" />
        </Link>
      )}
    </div>
  );
}
export function FriendProfile() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const person = state.people.find((p) => p.id === id);
  const [remove, setRemove] = useState(false);
  if (!person) return <NotFound />;
  const shared = state.challenges.filter(
    (c) =>
      c.participants.some((p) => p.userId === "me") &&
      c.participants.some((p) => p.userId === person.id),
  );
  const owned = state.challenges.find((c) => c.creatorId === "me" && c.status === "active");
  const challengeFriend = () => {
    if (!owned) {
      navigate("/challenges");
      showToast("Create a challenge first.", "error");
      return;
    }
    dispatch({ type: "CHALLENGE_INVITE", id: owned.id, userId: person.id });
    showToast(`${person.name} invited to ${owned.title}.`);
    navigate(`/challenges/${owned.id}`);
  };
  return (
    <main className="screen">
      <Header title={person.name} back />
      <section className="profile-hero">
        <Avatar initials={person.initials} color={person.color} size="xl" online />
        <h2>{person.name}</h2>
        <p>@{person.username} · Demo account</p>
        <div className="level-pill">
          <Icon name="bolt" size={15} />
          Level {levelFromXp(person.xp)} · {person.progress}% momentum
        </div>
      </section>
      <section className="profile-stats">
        <div>
          <strong>{person.streak}</strong>
          <span>Day streak</span>
        </div>
        <div>
          <strong>{shared.length}</strong>
          <span>Shared challenges</span>
        </div>
        <div>
          <strong>{person.progress}%</strong>
          <span>Goal progress</span>
        </div>
      </section>
      {person.status === "friend" ? (
        <div className="action-grid">
          <button className="primary" onClick={challengeFriend}>
            <Icon name="trophy" />
            Challenge
          </button>
          <button className="secondary action-button" onClick={() => setRemove(true)}>
            <Icon name="x" />
            Remove
          </button>
        </div>
      ) : (
        <button
          className="primary wide"
          onClick={() => dispatch({ type: "FRIEND_STATUS", id: person.id, status: "outgoing" })}
        >
          Send friend request
        </button>
      )}
      <section className="section">
        <div className="section-head">
          <h2>Shared challenges</h2>
        </div>
        {shared.length ? (
          shared.map((c) => <ChallengeCard challenge={c} key={c.id} />)
        ) : (
          <Empty title="No shared challenges" text="Invite this friend to compete together." />
        )}
      </section>
      {remove && (
        <ConfirmDialog
          title={`Remove ${person.name}?`}
          text="They will no longer appear in your friends feed or friends-only leaderboard."
          confirmLabel="Remove friend"
          onClose={() => setRemove(false)}
          onConfirm={() => {
            dispatch({ type: "FRIEND_STATUS", id: person.id, status: "none" });
            setRemove(false);
            showToast("Friend removed.");
          }}
        />
      )}
    </main>
  );
}

export function FeedCard({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const item = state.feed.find((f) => f.id === id);
  const [comments, setComments] = useState(false);
  const [text, setText] = useState("");
  if (!item) return null;
  const person = personFor(state, item.userId);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: "FEED_COMMENT", id: item.id, text: text.trim() });
    setText("");
    showToast("Comment added.");
  };
  return (
    <article className="activity-item">
      <Link to={item.userId === "me" ? "/profile" : `/friends/${item.userId}`}>
        <Avatar
          initials={person?.initials ?? "?"}
          color={person?.color ?? "green"}
          size="md"
          online
          src={person?.id === "me" ? state.profile.avatar : undefined}
        />
      </Link>
      <div className="feed-content">
        <p>
          <strong>{person?.name}</strong> {item.text}
        </p>
        <span className="muted small">{relative(item.date)}</span>
        <div className="feed-actions">
          <button
            className={item.reactions.includes("me") ? "liked" : ""}
            onClick={() => dispatch({ type: "FEED_REACT", id: item.id })}
          >
            <Icon name="heart" size={16} />
            {item.reactions.length}
          </button>
          <button onClick={() => setComments(!comments)}>
            <Icon name="message" size={16} />
            {item.comments.length}
          </button>
          {item.target && <Link to={item.target}>View</Link>}
        </div>
        {comments && (
          <div className="comments">
            {item.comments.map((c) => {
              const author = personFor(state, c.userId);
              return (
                <p key={c.id}>
                  <strong>{author?.name}:</strong> {c.text}
                </p>
              );
            })}
            <form onSubmit={submit}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write encouragement…"
                maxLength={120}
              />
              <button aria-label="Send comment">
                <Icon name="arrow" />
              </button>
            </form>
          </div>
        )}
      </div>
      <span className="activity-kind green">
        <Icon name="trophy" />
      </span>
    </article>
  );
}

export function Profile() {
  const { state } = useStore();
  const cash = useMoney();
  const [editingProfile, setEditingProfile] = useState(false);
  const level = levelFromXp(state.profile.xp);
  const xp = levelProgress(state.profile.xp);
  const completed = state.challenges.filter(
    (c) => c.status === "completed" && c.participants.some((p) => p.userId === "me"),
  ).length;
  return (
    <main className="screen">
      <Header
        title="Profile"
        action={
          <Link className="icon-button" to="/settings" aria-label="Settings">
            <Icon name="settings" />
          </Link>
        }
      />
      <section className="profile-hero">
        <div className="profile-cover">
          {state.profile.banner ? (
            <img src={state.profile.banner} alt={`${state.profile.name}'s profile banner`} />
          ) : (
            <div className="profile-cover-art" aria-hidden="true" />
          )}
        </div>
        <div className="profile-hero-info">
          <Avatar
            initials={state.profile.initials}
            color="green"
            size="xl"
            src={state.profile.avatar}
          />
          <h2>{state.profile.name}</h2>
          <p>
            @{state.profile.username} · {state.profile.city}
          </p>
          {state.profile.bio?.trim() && <p className="profile-bio">{state.profile.bio}</p>}
          <div className="level-pill">
            <Icon name="bolt" size={15} />
            Level {level} · Momentum Maker
          </div>
        </div>
      </section>
      <section className="profile-customize-card">
        <Avatar
          initials={state.profile.initials}
          color="green"
          size="lg"
          src={state.profile.avatar}
        />
        <div className="profile-customize-copy">
          <p className="eyebrow">YOUR PROFILE</p>
          <h2>Customize your profile</h2>
          <p>Personalize your photo, banner, bio, and details.</p>
        </div>
        <button className="primary" onClick={() => setEditingProfile(true)}>
          <Icon name="edit" size={17} />
          Customize profile
        </button>
      </section>
      <section className="xp-card">
        <div>
          <span>LEVEL {level}</span>
          <strong>
            {xp.current} <small>/ {xp.needed} XP</small>
          </strong>
        </div>
        <Progress value={xp.percent} />
        <p>
          {xp.needed - xp.current} XP until Level {level + 1} · {weeklyStreak(state)} week streak
        </p>
      </section>
      <section className="profile-stats">
        <div>
          <strong>{cash(totalSaved(state))}</strong>
          <span>Total saved</span>
        </div>
        <div>
          <strong>{savingsStreak(state)}</strong>
          <span>Day streak</span>
        </div>
        <div>
          <strong>{completed}</strong>
          <span>Challenges won</span>
        </div>
      </section>
      <section className="section compact">
        <div className="section-head">
          <h2>Badge cabinet</h2>
          <span className="muted small">{state.profile.earnedBadges.length} earned</span>
        </div>
        <div className="badges">
          {[
            { id: "first-step", icon: "target", title: "First step", sub: "Started saving" },
            { id: "streak-10", icon: "flame", title: "On fire", sub: "10 day streak" },
            { id: "social-saver", icon: "users", title: "Squad up", sub: "Added friends" },
            { id: "challenge-champion", icon: "trophy", title: "Champion", sub: "Complete 100%" },
          ].map((b) => (
            <div className={state.profile.earnedBadges.includes(b.id) ? "" : "locked"} key={b.id}>
              <span className="badge green">
                <Icon name={b.icon as "target"} />
              </span>
              <strong>{b.title}</strong>
              <small>{b.sub}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="settings-list">
        <Link to="/goals">
          <span className="setting-icon">
            <Icon name="target" />
          </span>
          <div>
            <strong>Savings goals</strong>
            <small>{state.goals.filter((g) => g.status === "active").length} active goals</small>
          </div>
          <Icon name="chevron" />
        </Link>
        <Link to="/transactions">
          <span className="setting-icon">
            <Icon name="wallet" />
          </span>
          <div>
            <strong>Transaction history</strong>
            <small>{state.transactions.length} simulated records</small>
          </div>
          <Icon name="chevron" />
        </Link>
        <Link to="/settings">
          <span className="setting-icon">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Privacy & settings</strong>
            <small>Control sharing and preferences</small>
          </div>
          <Icon name="chevron" />
        </Link>
      </section>
      {editingProfile && <ProfileForm onClose={() => setEditingProfile(false)} />}
    </main>
  );
}

export function Settings() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [reset, setReset] = useState(false);
  const update = (key: keyof typeof state.settings, value: boolean | string) => {
    dispatch({ type: "SETTINGS_UPDATE", settings: { [key]: value } });
    showToast("Preference saved.");
  };
  return (
    <main className="screen">
      <Header title="Settings" subtitle="Account and preferences" back />
      <section className="settings-group">
        <h2>Account</h2>
        <button onClick={() => setEditing(true)}>
          <span className="setting-icon">
            <Icon name="user" />
          </span>
          <div>
            <strong>Profile information</strong>
            <small>
              {state.profile.name} · @{state.profile.username}
            </small>
          </div>
          <Icon name="chevron" />
        </button>
      </section>
      <section className="settings-group">
        <h2>Privacy</h2>
        <SettingToggle
          icon="shield"
          title="Private progress"
          text="Share percentages, never balances"
          value={state.settings.privateProgress}
          onChange={(v) => update("privateProgress", v)}
        />
        <SettingToggle
          icon="users"
          title="Friend activity"
          text="Allow achievements in friends' feeds"
          value={state.settings.friendActivity}
          onChange={(v) => update("friendActivity", v)}
        />
      </section>
      <section className="settings-group">
        <h2>Notifications</h2>
        <SettingToggle
          icon="trophy"
          title="Challenge alerts"
          text="Invites, ranking changes, and deadlines"
          value={state.settings.challengeAlerts}
          onChange={(v) => update("challengeAlerts", v)}
        />
        <SettingToggle
          icon="target"
          title="Milestone alerts"
          text="Goal progress and achievement updates"
          value={state.settings.milestoneAlerts}
          onChange={(v) => update("milestoneAlerts", v)}
        />
      </section>
      <section className="settings-group">
        <h2>Display & currency</h2>
        <label className="settings-select">
          <span>
            <Icon name="wallet" />
            <div>
              <strong>Currency</strong>
              <small>Used for every financial value</small>
            </div>
          </span>
          <select
            value={state.settings.currency}
            onChange={(e) => update("currency", e.target.value)}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
          </select>
        </label>
        <div className="settings-select theme-setting">
          <span>
            <Icon name="settings" />
            <div>
              <strong>Appearance</strong>
              <small>Choose light or dark mode</small>
            </div>
          </span>
          <div className="theme-options" role="group" aria-label="Color theme">
            {(["light", "dark"] as const).map((theme) => (
              <button
                key={theme}
                type="button"
                aria-pressed={state.settings.theme === theme}
                onClick={() => update("theme", theme)}
              >
                {theme === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </div>
        <SettingToggle
          icon="bolt"
          title="Reduce motion"
          text="Minimize interface animations"
          value={state.settings.reducedMotion}
          onChange={(v) => update("reducedMotion", v)}
        />
      </section>
      <section className="settings-group danger-zone">
        <h2>Data management</h2>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "stash-demo-data.json";
            a.click();
            URL.revokeObjectURL(url);
            showToast("Demo data exported.");
          }}
        >
          <span className="setting-icon">
            <Icon name="download" />
          </span>
          <div>
            <strong>Export demo data</strong>
            <small>Download a JSON copy</small>
          </div>
          <Icon name="chevron" />
        </button>
        <button onClick={() => setReset(true)}>
          <span className="setting-icon danger">
            <Icon name="trash" />
          </span>
          <div>
            <strong>Reset prototype data</strong>
            <small>Restore the original sample state</small>
          </div>
          <Icon name="chevron" />
        </button>
      </section>
      {editing && <ProfileForm onClose={() => setEditing(false)} />}{" "}
      {reset && (
        <ConfirmDialog
          title="Reset all prototype data?"
          text="All goals, transactions, social actions, settings, and progress will be restored to the original demo state."
          confirmLabel="Reset everything"
          onClose={() => setReset(false)}
          onConfirm={() => {
            dispatch({ type: "RESET" });
            setReset(false);
            showToast("Prototype data reset.");
          }}
        />
      )}
    </main>
  );
}
function SettingToggle({
  icon,
  title,
  text,
  value,
  onChange,
}: {
  icon: "shield" | "users" | "trophy" | "target" | "bolt";
  title: string;
  text: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!value)}>
      <span className="setting-icon">
        <Icon name={icon} />
      </span>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
      <span className={`toggle ${value ? "on" : ""}`} role="switch" aria-checked={value}>
        <i />
      </span>
    </button>
  );
}
function ProfileForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [name, setName] = useState(state.profile.name);
  const [username, setUsername] = useState(state.profile.username);
  const [city, setCity] = useState(state.profile.city);
  const [initials, setInitials] = useState(state.profile.initials);
  const [avatar, setAvatar] = useState(state.profile.avatar);
  const [banner, setBanner] = useState(state.profile.banner);
  const [bio, setBio] = useState(state.profile.bio ?? "");
  const [error, setError] = useState("");
  const chooseImage = (
    file: File | undefined,
    currentImage: string | undefined,
    onLoad: (image: string) => void,
  ) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      return setError("Choose a PNG, JPEG, or WebP image.");
    if (file.size > 1_500_000) return setError("Images must be smaller than 1.5 MB.");
    const storedImageSize = currentImage?.includes(";base64,")
      ? Math.floor((currentImage.length - currentImage.indexOf(",") - 1) * 0.75)
      : 0;
    if (file.size + storedImageSize > 1_500_000)
      return setError("Profile photo and banner must total less than 1.5 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Couldn't read that image. Try another file.");
        return;
      }
      setError("");
      onLoad(reader.result);
    };
    reader.onerror = () => setError("Couldn't read that image. Try another file.");
    reader.readAsDataURL(file);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Display name is required.");
    if (!/^[a-z0-9_]{3,20}$/i.test(username))
      return setError("Username must be 3–20 letters, numbers, or underscores.");
    if (!initials.trim()) return setError("Profile initials are required.");
    dispatch({
      type: "PROFILE_UPDATE",
      profile: {
        name: name.trim(),
        username: username.toLowerCase(),
        city: city.trim(),
        initials: initials.slice(0, 2).toUpperCase(),
        avatar,
        banner,
        bio: bio.trim(),
      },
    });
    showToast("Profile updated.");
    onClose();
  };
  return (
    <Sheet title="Edit profile" onClose={onClose}>
      <span className="modal-icon">
        <Icon name="user" />
      </span>
      <h2>Edit profile</h2>
      <p className="muted">Update your public photo, banner, and bio.</p>
      <form onSubmit={submit}>
        <div className="photo-picker">
          <Avatar initials={initials || "AK"} color="green" size="xl" src={avatar} />
          <label className="photo-picker-upload">
            Upload profile photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                chooseImage(e.target.files?.[0], banner, setAvatar);
                e.currentTarget.value = "";
              }}
            />
          </label>
          {avatar && (
            <button
              type="button"
              onClick={() => {
                setAvatar(undefined);
                setError("");
              }}
            >
              Remove
            </button>
          )}
        </div>
        <div className="profile-banner-editor">
          <div className="profile-banner-preview">
            {banner ? (
              <img src={banner} alt="Profile banner preview" />
            ) : (
              <span>Banner preview</span>
            )}
          </div>
          <div className="profile-banner-actions">
            <label className="photo-picker-upload">
              Upload profile banner
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  chooseImage(e.target.files?.[0], avatar, setBanner);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {banner && (
              <button
                type="button"
                onClick={() => {
                  setBanner(undefined);
                  setError("");
                }}
              >
                Remove banner
              </button>
            )}
          </div>
        </div>
        <label className="field">
          DISPLAY NAME
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          USERNAME
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <div className="field-row">
          <label className="field">
            CITY
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className="field">
            AVATAR INITIALS
            <input value={initials} maxLength={2} onChange={(e) => setInitials(e.target.value)} />
          </label>
        </div>
        <label className="field">
          BIO
          <textarea
            value={bio}
            maxLength={160}
            rows={3}
            placeholder="A little about you..."
            onChange={(e) => setBio(e.target.value)}
          />
          <small className="bio-count">{bio.length}/160</small>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary wide modal-primary">Save profile</button>
      </form>
    </Sheet>
  );
}

export function Notifications() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  return (
    <main className="screen">
      <Header
        title="Notifications"
        subtitle={`${state.notifications.filter((n) => !n.read).length} unread`}
        back
        action={
          <button
            className="text-button"
            onClick={() => dispatch({ type: "NOTIFICATIONS_READ_ALL" })}
          >
            Mark all read
          </button>
        }
      />
      {state.notifications.length ? (
        <div className="notification-list">
          {state.notifications.map((n) => (
            <article className={`notification-card ${n.read ? "read" : ""}`} key={n.id}>
              <button
                className="notification-main"
                onClick={() => {
                  dispatch({ type: "NOTIFICATION_READ", id: n.id });
                  navigate(n.route);
                }}
              >
                <span className={`notification-kind ${n.kind}`}>
                  <Icon
                    name={
                      n.kind === "friend"
                        ? "users"
                        : n.kind === "challenge"
                          ? "trophy"
                          : n.kind === "achievement"
                            ? "medal"
                            : "bell"
                    }
                  />
                </span>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <small>{relative(n.date)}</small>
                </div>
                {!n.read && <i />}
              </button>
              <button
                className="delete-note"
                onClick={() => dispatch({ type: "NOTIFICATION_DELETE", id: n.id })}
                aria-label="Delete notification"
              >
                <Icon name="trash" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon="bell"
          title="You're all caught up"
          text="New social and savings updates will appear here."
        />
      )}
    </main>
  );
}
export function NotFound() {
  return (
    <main className="screen">
      <Header title="Page not found" back />
      <Empty
        title="This page moved"
        text="The item may have been deleted or the link is invalid."
        action={
          <Link className="primary" to="/">
            Back home
          </Link>
        }
      />
    </main>
  );
}
