//url ссылка на аватар

export default function AvatarUploader({ userId, url }) {
  return (
    <div>
      {url ? (
        <img className="avatar" src={url}></img>
      ) : (
        <img
          className="avatar"
          src={
            "https://i.pinimg.com/736x/16/3e/39/163e39beaa36d1f9a061b0f0c5669750.jpg"
          }
          alt="Аватар"
        />
      )}
    </div>
  );
}
