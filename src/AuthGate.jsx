import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function AuthGate({ sendSession, children }) {
  const [session, setSession] = useState();

  // Получение текущей сессии + подписка на изменения
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      const { data: sub } = await supabase.auth.onAuthStateChange(
        (_event, newSession) => setSession(newSession)
      );
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => unsub();
  }, []);

  // Создание/обновление профиля по факту наличия пользователя + проброс сессии вверх
  useEffect(() => {
    async function createProfileNote() {
      const { error } = await supabase.from("profiles").upsert([
        {
          id: session.user.id,
          email: session.user.email,
          updated_at: new Date().toISOString(),
        },
      ]);
      if (error) console.error(error);
    }

    if (session?.user) createProfileNote();

    // если нет сессии — отправляем null, чтобы App мог показать /login
    sendSession(session ?? null);
  }, [session, sendSession]);

  return <>{children}</>;
}
