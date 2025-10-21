import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useParams } from "react-router-dom";

export default function Chat() {
  // Приняли id человека на которого нажали в Users
  const { friend: friendId } = useParams();
  // Текущий пользователь
  const [me, setMe] = useState(null);
  // Собеседник
  const [friend, setFriend] = useState();
  // Список всех сообщений в диалоге
  const [messages, setMessages] = useState();
  // Текушее набираемое сообщение
  const [text, setText] = useState();

  // Получение текущего пользователя
  useEffect(() => {
    async function loadMe() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session?.user) {
          setMe(data.session.user);
        } else {
          console.warn("Сессия не найдена");
        }
      } catch (err) {
        console.error("Ошибка получения сессии:", err);
      }
    }

    loadMe();
  }, []);

  // Логируем, когда `me` изменяется
  useEffect(() => {
    console.log("me:", me);
  }, [me]);

  return <div>Chat</div>;
}
