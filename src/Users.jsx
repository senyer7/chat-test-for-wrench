import { useEffect, useState } from "react";
import Chat from "./Chat";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";

export default function Users() {
  const [profiles, setProfile] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email");

        if (error) {
          throw error;
        }

        console.log("Загружено пользователей:", data?.length);
        console.log("Данные:", data);

        setProfile(data || []);
      } catch (error) {
        console.error("Ошибка загрузки:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div>Загрузка пользователей...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div>
      <h2>Пользователи ({profiles.length})</h2>
      <ul>
        {profiles.map((element) => (
          <li key={element.id}>
            <Link to={`/chat/${element.id}`}>{element.email}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
