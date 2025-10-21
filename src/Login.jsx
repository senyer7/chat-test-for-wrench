import { useState } from "react";
import { supabase } from "./supabase";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  async function SignIn(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) console.error(error);
    else console.log("Вы зашли в свой ЛК");
  }

  async function SignUp(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) console.error(error);
  }

  return (
    <div className="login">
      <div className="panel">
        <h2>Вход</h2>
        <p className="sub">Добро пожаловать! Введите e-mail и пароль.</p>

        <form onSubmit={SignIn}>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Пароль"
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="actions">
            <button type="submit" className="btn-primary">
              sign in
            </button>
            <div className="hr">или</div>
            <button type="button" className="btn-ghost" onClick={SignUp}>
              sign up
            </button>
          </div>

          <p className="hint">
            После регистрации проверьте почту для подтверждения аккаунта.
          </p>
        </form>
      </div>
    </div>
  );
}
