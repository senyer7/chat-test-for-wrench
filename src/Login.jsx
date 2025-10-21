import { useState } from "react";
import { supabase } from "./supabase";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Ошибка входа:", error);
      alert("Ошибка входа: " + error.message);
    } else {
      console.log("Вы успешно вошли в личный кабинет");
    }

    setIsLoading(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Ошибка регистрации:", error);
      alert("Ошибка регистрации: " + error.message);
    } else {
      console.log("Регистрация успешна! Проверьте вашу почту.");
      alert(
        "Регистрация успешна! Пожалуйста, проверьте вашу почту для подтверждения аккаунта."
      );
    }

    setIsLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Добро пожаловать</h1>
        <p className="login-subtitle">
          Войдите в свой аккаунт или создайте новый
        </p>

        <form className="login-form" onSubmit={handleSignIn}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email адрес
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Введите ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <div className="login-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Войти в аккаунт"}
            </button>

            <div className="login-divider">или</div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? "Регистрация..." : "Создать аккаунт"}
            </button>
          </div>

          <p className="login-help">
            После регистрации проверьте вашу почту для подтверждения аккаунта.
            <br />
            Нажимая кнопки выше, вы соглашаетесь с нашими условиями
            использования.
          </p>
        </form>
      </div>
    </div>
  );
}
