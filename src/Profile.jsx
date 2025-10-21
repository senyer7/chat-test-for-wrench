// Profile.jsx (обновленный)
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./Profile.css";

export default function Profile({ session }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
  });

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
    }

    loadProfile();
  }, [userId]);

  // ===== Нормализация avatar_url → avatarSrc =====
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
        if (!cancelled) setAvatarSrc("");
        return;
      }

      const { data: signed, error: signedErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60);

      if (signedErr) {
        console.error("[createSignedUrl] error:", signedErr);
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

  async function handleSignOut() {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
    setIsLoading(false);
  }

  function handleInputChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsLoading(true);

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
    } else {
      setIsEditing(false);
      console.log("Профиль сохранён");
    }

    setIsLoading(false);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || file.size === 0) {
      alert("Файл не выбран или пустой");
      return;
    }

    setIsLoading(true);
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
      alert("Ошибка загрузки: " + uploadError.message);
      setIsLoading(false);
      return;
    }

    const { data: pub } = await supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const imageLink = pub.publicUrl;
    setForm((prev) => ({ ...prev, avatar_url: imageLink }));

    const { error: upsertError } = await supabase.from("profiles").upsert([
      {
        id: userId,
        avatar_url: imageLink,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (upsertError) {
      console.error("[profiles.upsert] error:", upsertError);
      alert("Ошибка сохранения профиля: " + upsertError.message);
    } else {
      console.log("Аватар обновлён:", imageLink);
    }

    setIsLoading(false);
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1 className="profile-title">Профиль</h1>
        </div>

        <div className="profile-info stack">
          <div>
            <strong>ID:</strong> {userId}
          </div>
          <div>
            <strong>Email:</strong> {userEmail}
          </div>
        </div>

        {isEditing ? (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Псевдоним</label>
              <input
                className="form-input"
                value={form.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Ваш псевдоним"
              />
            </div>

            <div className="form-group">
              <label className="form-label">ФИО</label>
              <input
                className="form-input"
                value={form.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Ваше полное имя"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Статус</label>
              <input
                className="form-input"
                value={form.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Ваш статус"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Аватар</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="form-input file-input"
              />
            </div>

            <div className="form-group">
              <div className="profile-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <img
              className="profile-avatar"
              src={avatarSrc || "https://placehold.co/160x160?text=No+avatar"}
              alt="Аватар"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/160x160?text=No+avatar";
              }}
            />

            <div className="profile-meta">
              <h2 className="profile-name">{form.full_name || "Без имени"}</h2>
              <div className="profile-username">
                {form.username ? `@${form.username}` : "—"}
              </div>

              {form.bio && <p className="profile-bio">{form.bio}</p>}

              <div className="profile-ids">
                <div>
                  <strong>ID:</strong> {userId}
                </div>
                <div>
                  <strong>Email:</strong> {userEmail}
                </div>
              </div>

              <div className="profile-actions">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  Редактировать
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  {isLoading ? "Выход..." : "Выйти"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
