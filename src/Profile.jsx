// Полноценная страница профиля без Header внутри
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./Profile.css";

export default function Profile({ session }) {
  const [isEditing, setIsEditing] = useState(false);

  // Данные профиля из БД
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    bio: "",
    // Может быть: полный URL (public) или путь в бакете (userId/xxx.ext)
    avatar_url: "",
  });

  // Итоговый src для <img> (с анти-кэшем и фолбэком на signed URL)
  const [avatarSrc, setAvatarSrc] = useState("");

  const userId = session.user.id;
  const userEmail = session.user.email;

  // ==== helpers ====
  function extractPathFromPublicUrl(val) {
    const marker = "/storage/v1/object/public/avatars/";
    const idx = val.indexOf(marker);
    if (idx === -1) return null;
    return val.slice(idx + marker.length);
  }

  function withBust(url) {
    return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
  }

  // ===== Загрузка профиля =====
  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, full_name, bio, avatar_url")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("[loadProfile] error:", error);
        }
        return;
      }
      setForm((prev) => ({ ...prev, ...data }));
      console.log("[profile] avatar_url from DB:", data?.avatar_url);
    }

    loadProfile();
  }, [userId]);

  // ===== Нормализация avatar_url → avatarSrc с фолбэком на signed URL =====
  useEffect(() => {
    let cancelled = false;

    async function makeSrc() {
      const val = form.avatar_url;
      if (!val) {
        if (!cancelled) setAvatarSrc("");
        return;
      }

      // 1) кандидат: public URL
      let publicUrl = "";
      if (/^https?:\/\//i.test(val)) {
        publicUrl = val;
      } else {
        const { data, error } = supabase.storage
          .from("avatars")
          .getPublicUrl(val);
        if (error) {
          console.error("[getPublicUrl] error:", error);
        } else {
          publicUrl = data.publicUrl;
        }
      }

      if (publicUrl) {
        const testUrl = withBust(publicUrl);
        try {
          const res = await fetch(testUrl, { cache: "no-store" });
          if (res.ok) {
            if (!cancelled) setAvatarSrc(testUrl);
            return;
          }
          console.warn("[avatar public fetch] not OK:", res.status, testUrl);
        } catch (err) {
          console.warn("[avatar public fetch] error:", err);
        }
      }

      // 2) фолбэк: signed URL
      let path = "";
      if (/^https?:\/\//i.test(val)) {
        path = extractPathFromPublicUrl(val) || "";
      } else {
        path = val;
      }

      if (!path) {
        console.error(
          "[signed fallback] no path can be derived from avatar_url:",
          val
        );
        if (!cancelled) setAvatarSrc("");
        return;
      }

      const { data: signed, error: signedErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60);

      if (signedErr) {
        console.error("[createSignedUrl] error:", signedErr);
        const { data: list, error: listErr } = await supabase.storage
          .from("avatars")
          .list(userId, {
            limit: 50,
            sortBy: { column: "name", order: "desc" },
          });
        if (listErr) console.error("[storage.list] error:", listErr);
        else console.log("[storage.list]", list);
        if (!cancelled) setAvatarSrc("");
        return;
      }

      const signedBusted = withBust(signed.signedUrl);
      if (!cancelled) setAvatarSrc(signedBusted);
    }

    makeSrc();
    return () => {
      cancelled = true;
    };
  }, [form.avatar_url, userId]);

  // ===== Выход (здесь продублирован не нужен, есть в Header) =====
  async function handleClick() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
  }

  // ===== Контроллер инпутов =====
  function inputCollector(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ===== Сохранение профиля =====
  async function handleSave(e) {
    e.preventDefault();

    const payload = {
      id: userId,
      email: userEmail ?? null,
      username: form.username || null,
      full_name: form.full_name || null,
      bio: form.bio || null,
      avatar_url: form.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert([payload]);
    if (error) {
      console.error("[handleSave.upsert] error:", error);
      alert("Ошибка сохранения профиля: " + error.message);
      return;
    }
    setIsEditing(false);
    console.log("Профиль сохранён");
  }

  // ===== Загрузка файла аватара в public-бакет =====
  async function handleChange(e) {
    const file = e.target.files?.[0];
    console.log(
      "[file]",
      file && { name: file.name, size: file.size, type: file.type }
    );
    if (!file || file.size === 0) {
      alert("Файл не выбран или пустой");
      return;
    }

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "image/png",
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[Storage.upload] error:", uploadError);
      alert("Ошибка загрузки: " + (uploadError.message || "см. консоль"));
      return;
    }

    const { data: pub, error: pubErr } = await supabase.storage
      .from("avatars")
      .getPublicUrl(path);
    if (pubErr) {
      console.error("[getPublicUrl] error:", pubErr);
      alert("Ошибка получения ссылки: " + (pubErr.message || "см. консоль"));
      return;
    }

    const imageLink = pub.publicUrl;

    // Локально сразу показываем (в БД храним public URL — но фолбэк на signed у нас есть)
    setForm((prev) => ({ ...prev, avatar_url: imageLink }));

    const { error: upsertError } = await supabase.from("profiles").upsert([
      {
        id: userId,
        email: userEmail ?? null,
        username: form.username || null,
        full_name: form.full_name || null,
        bio: form.bio || null,
        avatar_url: imageLink,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (upsertError) {
      console.error("[profiles.upsert] error:", upsertError);
      alert("Ошибка сохранения профиля: " + upsertError.message);
      return;
    }

    console.log("Аватар обновлён:", imageLink);
  }

  return (
    <div className="profile">
      <div className="panel">
        <div className="header">
          <div className="title">Профиль</div>
        </div>

        <div className="info stack">
          <p>
            <strong>ID</strong> {userId}
          </p>
          <p>
            <strong>EMAIL</strong> {userEmail}
          </p>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave}>
            <input
              value={form.username}
              onChange={(e) => inputCollector("username", e.target.value)}
              placeholder="Псевдоним"
            />
            <input
              value={form.full_name}
              onChange={(e) => inputCollector("full_name", e.target.value)}
              placeholder="ФИО"
            />
            <input
              value={form.bio}
              onChange={(e) => inputCollector("bio", e.target.value)}
              placeholder="Статус"
            />
            <input type="file" accept="image/*" onChange={handleChange} />

            <div className="actions">
              <button type="button" onClick={() => setIsEditing(false)}>
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                Изменить
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view card">
            <div className="avatar">
              <img
                src={avatarSrc || "https://placehold.co/160x160?text=No+avatar"}
                alt="avatar"
                style={{
                  width: 100,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: 16,
                }}
                crossOrigin="anonymous"
                onError={(e) => {
                  console.warn("avatar load error, src:", avatarSrc);
                  e.currentTarget.src =
                    "https://placehold.co/160x160?text=No+avatar";
                }}
              />
            </div>

            <div className="meta">
              <h2 className="name">{form.full_name || "Без имени"}</h2>
              <div className="username">
                {form.username ? `@${form.username}` : "—"}
              </div>
              {form.bio && <p className="bio">{form.bio}</p>}

              <div className="ids">
                <div>
                  <strong>ID:</strong> {userId}
                </div>
                <div>
                  <strong>Email:</strong> {userEmail}
                </div>
              </div>

              <div className="actions">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  Редактировать
                </button>
                <button onClick={handleClick} className="btn-ghost">
                  Выход
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
