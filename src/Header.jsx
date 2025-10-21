import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./Header.css";

export default function Header({ session }) {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
    else navigate("/login", { replace: true });
  }

  return (
    <header className="header">
      <nav className="nav">
        <NavLink
          to="/home"
          className={({ isActive }) => (isActive ? "link active" : "link")}
        >
          Домашняя
        </NavLink>
        <NavLink
          to="/users"
          className={({ isActive }) => (isActive ? "link active" : "link")}
        >
          Пользователи
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => (isActive ? "link active" : "link")}
        >
          Профиль
        </NavLink>
      </nav>

      <div className="auth">
        <span className="email">{session?.user?.email}</span>
        <button className="btn-ghost" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </header>
  );
}
