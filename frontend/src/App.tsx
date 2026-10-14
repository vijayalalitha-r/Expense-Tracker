import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Account = { id?: number; name: string };
type Expense = {
  id?: number;
  title: string;
  amount: number;
  category: string;
  recurring: boolean;
  recurrence: string;
  dueDate: string | null;
  account?: Account;
};
type Budget = { id?: number; category: string; amount: number };

const API = "http://localhost:8080/api";
const palette = ["#4f9cff", "#08cfa0", "#a58af8", "#ffca69", "#ff6485", "#39c4d9"];

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function App({ onSignOut }: { onSignOut?: () => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState("MONTHLY");
  const [dueDate, setDueDate] = useState("");

  const [newAccount, setNewAccount] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAccount, setSelectedAccount] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const loggedInName = sessionStorage.getItem("expenseTrackerUser")?.trim() || "User";
  const profileInitial = loggedInName.charAt(0).toUpperCase() || "U";

  const loadAll = async () => {
    try {
      setLoadError("");
      const [er, ar, br] = await Promise.all([
        fetch(`${API}/expenses`),
        fetch(`${API}/accounts`),
        fetch(`${API}/budgets`),
      ]);

      if (!er.ok || !ar.ok || !br.ok) {
        throw new Error("Unable to load backend data");
      }

      const [e, a, b] = await Promise.all([
        er.json(),
        ar.json(),
        br.json(),
      ]);

      setExpenses(e);
      setAccounts(a);
      setBudgets(b);
    } catch (error) {
      console.error(error);
      setLoadError(
        "Unable to connect to Spring Boot. Check that the backend is running on port 8080."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  // Switch the visible page instead of scrolling to a section.
  const scrollToSection = (id: string) => {
    setActiveNav(id);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const clearExpenseForm = () => {
    setTitle("");
    setAmount("");
    setCategory("");
    setAccountId("");
    setRecurring(false);
    setRecurrence("MONTHLY");
    setDueDate("");
    setEditingId(null);
  };

  const addAccount = async () => {
    const name = newAccount.trim();

    if (!name) {
      alert("Please enter an account name.");
      return;
    }

    if (
      accounts.some(
        (a) => a.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("This account already exists.");
      return;
    }

    try {
      const response = await fetch(`${API}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Unable to add account");

      setNewAccount("");
      await loadAll();
      alert("Account added successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to add account. Please check the backend.");
    }
  };

  const saveExpense = async () => {
    if (
      !title.trim() ||
      !amount ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !category.trim() ||
      !accountId
    ) {
      alert("Enter a title, valid amount, category and account.");
      return;
    }

    const payload = {
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
      recurring,
      recurrence: recurring ? recurrence : "",
      dueDate: recurring ? dueDate || null : null,
      account: { id: Number(accountId) },
    };

    try {
      const isEditing = editingId !== null;
      const response = await fetch(
        isEditing
          ? `${API}/expenses/${editingId}`
          : `${API}/expenses`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Unable to save expense");

      clearExpenseForm();
      await loadAll();
      alert(isEditing ? "Expense updated!" : "Expense added!");
    } catch (error) {
      console.error(error);
      alert("Unable to save the expense. Check the backend.");
    }
  };

  const startEdit = (expense: Expense) => {
    if (expense.id == null) {
      alert("This expense cannot be edited because it has no ID.");
      return;
    }

    setEditingId(expense.id);
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setAccountId(String(expense.account?.id ?? ""));
    setRecurring(Boolean(expense.recurring));
    setRecurrence(expense.recurrence || "MONTHLY");
    setDueDate(expense.dueDate || "");
    scrollToSection("expense-form");
  };

  const deleteExpense = async (id?: number) => {
    if (id == null || !window.confirm("Do you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Unable to delete expense");
      await loadAll();
    } catch (error) {
      console.error(error);
      alert("Unable to delete expense.");
    }
  };

  const addBudget = async () => {
    const name = budgetCategory.trim();

    if (!name || !budgetAmount || Number(budgetAmount) <= 0) {
      alert("Enter a budget category and a valid amount.");
      return;
    }

    if (
      budgets.some(
        (b) => b.category.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("A budget already exists for this category.");
      return;
    }

    try {
      const response = await fetch(`${API}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: name,
          amount: Number(budgetAmount),
        }),
      });

      if (!response.ok) throw new Error("Unable to save budget");

      setBudgetCategory("");
      setBudgetAmount("");
      await loadAll();
      alert("Budget saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Unable to save the budget.");
    }
  };

  const deleteBudget = async (id?: number) => {
    if (id == null || !window.confirm("Delete this budget?")) return;

    try {
      const response = await fetch(`${API}/budgets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Unable to delete budget");
      await loadAll();
    } catch (error) {
      console.error(error);
      alert("Unable to delete budget.");
    }
  };

  const exportCSV = () => {
    const headers = [
      "Title",
      "Amount",
      "Category",
      "Account",
      "Recurring",
      "Recurrence",
      "Due Date",
    ];

    const rows = expenses.map((e) => [
      e.title,
      e.amount,
      e.category,
      e.account?.name ?? "",
      e.recurring ? "Yes" : "No",
      e.recurrence ?? "",
      e.dueDate ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expense-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const averageExpense = expenses.length
    ? totalExpenses / expenses.length
    : 0;

  const highestExpense = expenses.reduce<Expense | null>(
    (high, e) =>
      !high || Number(e.amount) > Number(high.amount) ? e : high,
    null
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach((e) => {
      const key = e.category || "Uncategorized";
      totals[key] = (totals[key] || 0) + Number(e.amount || 0);
    });

    return totals;
  }, [expenses]);

  const categoryEntries = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const categories = Array.from(
    new Set(expenses.map((e) => e.category).filter(Boolean))
  );

  const totalCategorySpend = categoryEntries.reduce(
    (sum, [, value]) => sum + value,
    0
  );

  let donutCursor = 0;

  const donutGradient = categoryEntries.length
    ? `conic-gradient(${categoryEntries
        .map(([, value], index) => {
          const start = donutCursor;
          donutCursor += totalCategorySpend
            ? (value / totalCategorySpend) * 100
            : 0;

          return `${palette[index % palette.length]} ${start}% ${donutCursor}%`;
        })
        .join(", ")})`
    : "conic-gradient(#e9edf5 0% 100%)";

  const budgetInsights = budgets.map((b) => {
    const spent = expenses
      .filter(
        (e) =>
          e.category.trim().toLowerCase() ===
          b.category.trim().toLowerCase()
      )
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const limit = Number(b.amount || 0);
    const percent = limit > 0 ? (spent / limit) * 100 : 0;

    return {
      ...b,
      spent,
      remaining: limit - spent,
      percent,
    };
  });

  const budgetAlerts = budgetInsights.filter((b) => b.percent >= 80);
  const today = new Date().toISOString().slice(0, 10);

  const recurringDue = expenses.filter(
    (e) => e.recurring && e.dueDate && e.dueDate <= today
  );

  const filteredExpenses = expenses
    .filter((e) => {
      const search = searchText.trim().toLowerCase();

      const matchesSearch =
        e.title.toLowerCase().includes(search) ||
        e.category.toLowerCase().includes(search) ||
        (e.account?.name ?? "").toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "All" || e.category === selectedCategory;

      const matchesAccount =
        selectedAccount === "All" ||
        String(e.account?.id ?? "") === selectedAccount;

      return matchesSearch && matchesCategory && matchesAccount;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return Number(a.id ?? 0) - Number(b.id ?? 0);
      }
      if (sortBy === "amount-high") return b.amount - a.amount;
      if (sortBy === "amount-low") return a.amount - b.amount;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return Number(b.id ?? 0) - Number(a.id ?? 0);
    });

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-spinner" />
        <h2>Loading your Vault...</h2>
        <p>Connecting to your finance data</p>
      </main>
    );
  }

  return (
    <div className="vault-layout">
      <aside className="sidebar">
        <div className="profile-header">
          <div className="avatar profile-avatar" aria-label={`${loggedInName} profile`}>
            {profileInitial}
          </div>
          <div className="profile-name-wrap">
            <strong className="profile-name" title={loggedInName}>{loggedInName}</strong>
            <small>My Finance</small>
          </div>
          {onSignOut && (
            <button
              className="profile-sign-out"
              onClick={onSignOut}
              type="button"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <span aria-hidden="true">⇥</span>
            </button>
          )}
        </div>

        <p className="side-label">OVERVIEW</p>
        <button
          className={`nav-item ${activeNav === "dashboard" ? "active" : ""}`}
          onClick={() => scrollToSection("dashboard")}
        >
          <span>▦</span> Dashboard
        </button>
        <button
          className={`nav-item ${activeNav === "analytics-section" ? "active" : ""}`}
          onClick={() => scrollToSection("analytics-section")}
        >
          <span>▥</span> Analytics
        </button>
        <button
          className={`nav-item ${activeNav === "accounts-section" ? "active" : ""}`}
          onClick={() => scrollToSection("accounts-section")}
        >
          <span>▣</span> Accounts
        </button>

        <p className="side-label">FINANCE</p>
        <button
          className={`nav-item ${activeNav === "expense-list" ? "active" : ""}`}
          onClick={() => scrollToSection("expense-list")}
        >
          <span>↕</span> Transactions
          <span className="nav-count">{expenses.length}</span>
        </button>
        <button
          className={`nav-item ${activeNav === "expense-form" ? "active" : ""}`}
          onClick={() => {
            clearExpenseForm();
            scrollToSection("expense-form");
          }}
        >
          <span>＋</span> Add Expense
        </button>


      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="welcome">
            Welcome back 👋
            <small>Here is your financial overview</small>
          </div>
          <div className="top-actions">
            <span className="today-pill">MY DASHBOARD</span>
            <button className="top-export" onClick={exportCSV}>
              ↓ Export CSV
            </button>
          </div>
        </header>

        {loadError && (
          <div className="error-banner">
            <span>{loadError}</span>
            <button onClick={() => void loadAll()}>Retry</button>
          </div>
        )}

        <div className={`page-content page-${activeNav}`}>
          <section id="dashboard" className="dashboard-grid">
            <article className="stat-card stat-green">
              <span className="stat-label">TOTAL SPENT</span>
              <span className="stat-icon">₹</span>
              <h2 className="stat-value">{money(totalExpenses)}</h2>
              <p className="stat-foot">Across all recorded expenses</p>
            </article>

            <article className="stat-card stat-blue">
              <span className="stat-label">TRANSACTIONS</span>
              <span className="stat-icon">↗</span>
              <h2 className="stat-value">{expenses.length}</h2>
              <p className="stat-foot">Recorded expenses</p>
            </article>

            <article className="stat-card stat-purple">
              <span className="stat-label">ACCOUNTS</span>
              <span className="stat-icon">▣</span>
              <h2 className="stat-value">{accounts.length}</h2>
              <p className="stat-foot">Payment methods available</p>
            </article>

            <article className="stat-card stat-orange">
              <span className="stat-label">ACTIVE BUDGETS</span>
              <span className="stat-icon">◎</span>
              <h2 className="stat-value">{budgets.length}</h2>
              <p className="stat-foot">Spending limits set</p>
            </article>
          </section>

          <section className="mini-insights">
            <article className="mini-card">
              <span>Average expense</span>
              <strong>{money(averageExpense)}</strong>
            </article>
            <article className="mini-card">
              <span>Highest expense</span>
              <strong>
                {highestExpense ? money(highestExpense.amount) : money(0)}
              </strong>
              <small>{highestExpense?.title ?? "No expenses yet"}</small>
            </article>
            <article className="mini-card">
              <span>Budget alerts</span>
              <strong>{budgetAlerts.length}</strong>
              <small>Categories using at least 80%</small>
            </article>
          </section>

          <section className="charts-grid">
            <article className="panel cashflow-panel">
              <div className="panel-heading">
                <div>
                  <h2>Spending Overview</h2>
                  <p>Category-wise expenses</p>
                </div>
                <span className="legend-dot">● Spending</span>
              </div>

              <div className="chart-area">
                <div className="chart-guides">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                {categoryEntries.length > 0 ? (
                  <div className="chart-bars">
                    {categoryEntries.slice(0, 7).map(([name, value], index) => (
                      <div className="chart-column" key={name}>
                        <div className="chart-bar-value">
                          {money(value)}
                        </div>
                        <div
                          className="chart-bar"
                          style={{
                            height: `${Math.max(
                              8,
                              (value / Math.max(...categoryEntries.map((x) => x[1]))) * 100
                            )}%`,
                            background: palette[index % palette.length],
                          }}
                        />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">
                    Add expenses to display your spending graph.
                  </p>
                )}
              </div>
            </article>

            <article className="panel spending-panel">
              <div className="panel-heading">
                <div>
                  <h2>Spending by Category</h2>
                  <p>Distribution of recorded expenses</p>
                </div>
              </div>

              <div className="donut-wrap">
                <div
                  className="donut"
                  style={{ background: donutGradient }}
                >
                  <div className="donut-center">
                    <strong>{money(totalCategorySpend)}</strong>
                    <small>Total spent</small>
                  </div>
                </div>
              </div>

              <div className="legend-list">
                {categoryEntries.slice(0, 5).map(([name, value], index) => (
                  <div className="legend-item" key={name}>
                    <span className="legend-name">
                      <i style={{ background: palette[index % palette.length] }} />
                      {name}
                    </span>
                    <strong>
                      {totalCategorySpend
                        ? Math.round((value / totalCategorySpend) * 100)
                        : 0}
                      % · {money(value)}
                    </strong>
                  </div>
                ))}
                {!categoryEntries.length && (
                  <p className="muted">No category data yet.</p>
                )}
              </div>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent Transactions</h2>
                  <p>Latest 5 expenses</p>
                </div>
                <button
                  className="text-action"
                  onClick={() => scrollToSection("expense-list")}
                >
                  View all →
                </button>
              </div>

              <div className="recent-list">
                {[...expenses]
                  .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
                  .slice(0, 5)
                  .map((e, index) => (
                    <div
                      className="recent-item"
                      key={e.id ?? `${e.title}-${index}`}
                    >
                      <span
                        className="transaction-icon"
                        style={{
                          background: `${palette[index % palette.length]}20`,
                          color: palette[index % palette.length],
                        }}
                      >
                        {e.category.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="transaction-info">
                        <strong>{e.title}</strong>
                        <small>
                          {e.category} · {e.account?.name ?? "No account"}
                        </small>
                      </div>
                      <span
                        className="category-chip"
                        style={{
                          color: palette[index % palette.length],
                          background: `${palette[index % palette.length]}18`,
                        }}
                      >
                        {e.category}
                      </span>
                      <strong className="transaction-amount">
                        −{money(Number(e.amount))}
                      </strong>
                    </div>
                  ))}
                {!expenses.length && (
                  <p className="empty-state">
                    Your recent expenses will appear here.
                  </p>
                )}
              </div>
            </article>

            <article className="panel goals-panel">
              <div className="panel-heading">
                <div>
                  <h2>Budget Goals</h2>
                  <p>{budgets.length} active budgets</p>
                </div>
                <button
                  className="text-action"
                  onClick={() => scrollToSection("budget-section")}
                >
                  + Add budget
                </button>
              </div>

              <div className="goal-list">
                {budgetInsights.slice(0, 5).map((b, index) => (
                  <div className="goal-item" key={b.id ?? b.category}>
                    <div className="goal-top">
                      <strong>{b.category}</strong>
                      <span>
                        {money(b.spent)} / {money(Number(b.amount))}
                      </span>
                    </div>
                    <div className="goal-track">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, b.percent))}%`,
                          background: palette[index % palette.length],
                        }}
                      />
                    </div>
                    <small>
                      {Math.round(b.percent)}% used ·{" "}
                      {b.remaining < 0
                        ? `${money(Math.abs(b.remaining))} over budget`
                        : `${money(b.remaining)} remaining`}
                    </small>
                  </div>
                ))}
                {!budgets.length && (
                  <p className="empty-state">
                    Set a budget to track your goals here.
                  </p>
                )}
              </div>
            </article>
          </section>

          {budgetAlerts.length > 0 && (
            <section className="budget-alert-banner">
              <span className="alert-symbol">!</span>
              <div>
                <strong>Budget attention needed</strong>
                <p>
                  {budgetAlerts
                    .map((b) => `${b.category} (${Math.round(b.percent)}%)`)
                    .join(" · ")}
                </p>
              </div>
              <button onClick={() => scrollToSection("budget-section")}>
                Review budgets
              </button>
            </section>
          )}

          {recurringDue.length > 0 && (
            <section className="reminder">
              <div>
                <strong>🔔 Recurring Expense Reminder</strong>
                <p>
                  You have {recurringDue.length} recurring expense(s) due or
                  overdue.
                </p>
              </div>
              {recurringDue.map((e) => (
                <span key={e.id ?? e.title}>
                  {e.title} · {money(Number(e.amount))} · Due {e.dueDate}
                </span>
              ))}
            </section>
          )}

          <section id="expense-form" className="app-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">RECORD YOUR SPENDING</span>
                <h2>
                  {editingId !== null ? "✏️ Edit Expense" : "＋ Add Expense"}
                </h2>
              </div>
              {editingId !== null && (
                <button className="secondary-button" onClick={clearExpenseForm}>
                  Cancel edit
                </button>
              )}
            </div>

            <div className="panel form expense-form">
              <input
                placeholder="Expense title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                placeholder="Category e.g. Food"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {accounts.map((a, i) => (
                  <option
                    key={a.id ?? `${a.name}-${i}`}
                    value={a.id ?? ""}
                    disabled={a.id == null}
                  >
                    {a.name}
                  </option>
                ))}
              </select>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                />
                Recurring expense
              </label>

              {recurring && (
                <>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                  <label className="date-field">
                    Due date
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </label>
                </>
              )}

              <button
                className="primary-button"
                onClick={() => void saveExpense()}
              >
                {editingId !== null ? "Update Expense" : "Add Expense"}
              </button>
            </div>
          </section>

          <section id="accounts-section" className="app-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">PAYMENT METHODS</span>
                <h2>▣ Accounts</h2>
              </div>
              <span className="section-count">{accounts.length} accounts</span>
            </div>

            <div className="panel account-box">
              <input
                placeholder="Account name e.g. Cash / Bank / UPI"
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addAccount();
                }}
              />
              <button className="primary-button" onClick={() => void addAccount()}>
                Add Account
              </button>
            </div>

            <div className="account-list">
              {accounts.map((a, i) => (
                <article
                  className="account-card"
                  key={a.id ?? `${a.name}-${i}`}
                >
                  <span className="account-symbol">▣</span>
                  <strong>{a.name}</strong>
                  <small>Payment account</small>
                </article>
              ))}
              {!accounts.length && (
                <p className="empty-state">
                  Add your first account to get started.
                </p>
              )}
            </div>
          </section>

          <section id="budget-section" className="app-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">PLAN AHEAD</span>
                <h2>◎ Manage Budgets</h2>
              </div>
            </div>

            <div className="panel budget-form">
              <input
                placeholder="Budget category e.g. Food"
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value)}
              />
              <input
                type="number"
                min="0.01"
                placeholder="Budget amount (₹)"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
              <button
                className="primary-button"
                onClick={() => void addBudget()}
              >
                Save Budget
              </button>
            </div>

            <div className="budget-list">
              {budgetInsights.map((b, i) => (
                <article
                  className="budget-card"
                  key={b.id ?? `${b.category}-${i}`}
                >
                  <div className="budget-header">
                    <strong>{b.category}</strong>
                    {b.id != null && (
                      <button
                        className="delete-button"
                        onClick={() => void deleteBudget(b.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <div className="budget-numbers">
                    <span>
                      Budget <strong>{money(Number(b.amount))}</strong>
                    </span>
                    <span>
                      Spent <strong>{money(b.spent)}</strong>
                    </span>
                    <span>
                      Remaining{" "}
                      <strong className={b.remaining < 0 ? "negative-value" : ""}>
                        {money(b.remaining)}
                      </strong>
                    </span>
                  </div>

                  <div className="bar-background">
                    <div
                      className={`bar ${
                        b.percent >= 100
                          ? "over-budget"
                          : b.percent >= 80
                          ? "near-budget"
                          : ""
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, b.percent))}%`,
                      }}
                    />
                  </div>

                  <div className="budget-footer">
                    <span>{Math.round(b.percent)}% used</span>
                    <span>
                      {b.percent >= 100
                        ? "Limit exceeded"
                        : b.percent >= 80
                        ? "Approaching limit"
                        : "Within budget"}
                    </span>
                  </div>
                </article>
              ))}

              {!budgets.length && (
                <p className="empty-state">
                  No budgets yet. Set a category limit to track your spending.
                </p>
              )}
            </div>
          </section>

          <section id="analytics-section" className="app-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">UNDERSTAND YOUR HABITS</span>
                <h2>▥ Expense Analytics</h2>
              </div>
            </div>

            <div className="analytics-grid">
              {categoryEntries.map(([name, value], index) => (
                <article className="analytics-row" key={name}>
                  <div className="analytics-label">
                    <span>
                      <i style={{ background: palette[index % palette.length] }} />
                      {name}
                    </span>
                    <strong>{money(value)}</strong>
                  </div>
                  <div className="bar-background">
                    <div
                      className="bar"
                      style={{
                        width: `${totalExpenses ? (value / totalExpenses) * 100 : 0}%`,
                        background: palette[index % palette.length],
                      }}
                    />
                  </div>
                  <small>
                    {totalExpenses
                      ? ((value / totalExpenses) * 100).toFixed(1)
                      : "0.0"}
                    % of total spending
                  </small>
                </article>
              ))}

              {!categoryEntries.length && (
                <p className="empty-state">
                  Add expenses to see category-wise analytics.
                </p>
              )}
            </div>
          </section>

          <section id="expense-list" className="app-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">YOUR TRANSACTIONS</span>
                <h2>↕ Transactions</h2>
              </div>
              <span className="section-count">
                {filteredExpenses.length} shown
              </span>
            </div>

            <div className="panel search-filter">
              <input
                type="search"
                placeholder="Search title, category or account..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="All">All Accounts</option>
                {accounts.map((a, i) => (
                  <option
                    key={a.id ?? `${a.name}-${i}`}
                    value={a.id ?? ""}
                    disabled={a.id == null}
                  >
                    {a.name}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount-high">Highest amount</option>
                <option value="amount-low">Lowest amount</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>

            <div className="expense-list">
              {filteredExpenses.map((e, i) => (
                <article
                  className="expense-card"
                  key={e.id ?? `${e.title}-${i}`}
                >
                  <div className="expense-main">
                    <span
                      className="expense-category-chip"
                      style={{
                        color: palette[i % palette.length],
                        background: `${palette[i % palette.length]}18`,
                      }}
                    >
                      {e.category}
                    </span>
                    <h3>{e.title}</h3>
                    <strong className="expense-amount">
                      {money(Number(e.amount))}
                    </strong>
                    <p>Account: {e.account?.name ?? "Not specified"}</p>
                    {e.recurring && (
                      <p className="recurring-tag">
                        ↻ {e.recurrence || "Recurring"}
                        {e.dueDate ? ` · Due ${e.dueDate}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="card-buttons">
                    <button className="edit-button" onClick={() => startEdit(e)}>
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => void deleteExpense(e.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}

              {!filteredExpenses.length && (
                <div className="no-expenses">
                  <h3>No expenses found</h3>
                  <p>Try changing your search or filters, or add a new expense.</p>
                  <button
                    onClick={() => {
                      setSearchText("");
                      setSelectedCategory("All");
                      setSelectedAccount("All");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>

          <footer className="app-footer">
            <p>Take control of your money, one expense at a time.</p>
            <button onClick={() => scrollToSection("dashboard")}>
              ↑ Back to top
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;