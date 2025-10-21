import { useEffect, useState } from "react";
import Chat from "./Chat";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";

export default function Users() {
  const [profiles, setProfile] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("profiles").select("id, email");
        setProfile(data);
      } catch (error) {
        console.error(error);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h2>Пользователи</h2>
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
