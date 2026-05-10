import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [todos, setTodos] = useState([]);
  const [todoForm, setTodoForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");

  async function api(path, options = {}) {
    const headers = options.headers || {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = "Request failed";
      try {
        const data = await response.json();
        message = data.detail || message;
      } catch { }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async function loadMe() {
    if (!token) return;
    try {
      const data = await api("/auth/me");
      setUser(data);
      await loadTodos();
    } catch {
      logout();
    }
  }

  async function loadTodos() {
    const data = await api("/todos");
    setTodos(data);
  }

  useEffect(() => {
    loadMe();
  }, [token]);

  async function handleRegister(event) {
    event.preventDefault();
    setError("");

    try {
      await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      }).then(async (response) => {
        if (!response.ok) {
          const data = await response.json();

          throw new Error(
            Array.isArray(data.detail)
              ? data.detail.map((e) => e.msg).join(", ")
              : data.detail || "Registration failed"
          );
        }
      });

      setMode("login");
      setError("Registration successful. Please log in.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("username", authForm.email);
    formData.append("password", authForm.password);

    try {
      const data = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          const data = await response.json();

          throw new Error(
            Array.isArray(data.detail)
              ? data.detail.map((e) => e.msg).join(", ")
              : data.detail || "Login failed"
          );
        }
        return response.json();
      });

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createTodo(event) {
    event.preventDefault();
    setError("");

    try {
      await api("/todos", {
        method: "POST",
        body: JSON.stringify({
          title: todoForm.title,
          description: todoForm.description,
          completed: false,
        }),
      });
      setTodoForm({ title: "", description: "" });
      await loadTodos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTodo(todo) {
    await api(`/todos/${todo.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !todo.completed }),
    });
    await loadTodos();
  }

  async function deleteTodo(id) {
    await api(`/todos/${id}`, { method: "DELETE" });
    await loadTodos();
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setTodos([]);
  }

  if (!user) {
    return (
      <main className="container">
        <section className="card auth-card">
          <h1>Todo App argocd</h1>
          <p className="muted">Login or create an account to manage your todos.</p>

          <div className="tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
            <label>Email</label>
            <input
              type="email"
              required
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              placeholder="you@example.com"
            />

            <label>Password</label>
            <input
              type="password"
              required
              minLength="8"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              placeholder="Minimum 8 characters"
            />

            <button className="primary" type="submit">
              {mode === "login" ? "Login" : "Register"}
            </button>
          </form>

          {error && <p className="message">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="card">
        <div className="header">
          <div>
            <h1>My Todos</h1>
            <p className="muted">{user.email}</p>
          </div>
          <button onClick={logout}>Logout</button>
        </div>

        <form className="todo-form" onSubmit={createTodo}>
          <input
            required
            value={todoForm.title}
            onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })}
            placeholder="Todo title"
          />
          <input
            value={todoForm.description}
            onChange={(e) =>
              setTodoForm({ ...todoForm, description: e.target.value })
            }
            placeholder="Description optional"
          />
          <button className="primary" type="submit">Add</button>
        </form>

        {error && <p className="message">{error}</p>}

        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? "done" : ""}>
              <div>
                <strong>{todo.title}</strong>
                {todo.description && <p>{todo.description}</p>}
              </div>
              <div className="actions">
                <button onClick={() => toggleTodo(todo)}>
                  {todo.completed ? "Undo" : "Done"}
                </button>
                <button className="danger" onClick={() => deleteTodo(todo.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        {todos.length === 0 && <p className="empty">No todos yet.</p>}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
