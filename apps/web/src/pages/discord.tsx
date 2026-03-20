import { useEffect } from "react";

const DISCORD_URL = "https://discordapp.com/invite/fmqrqhkjHY/";

export default function Discord() {
  useEffect(() => {
    window.location.href = DISCORD_URL;
  }, []);

  return (
    <main className="flex w-full flex-col items-center gap-4 py-10">
      <p className="text-content-light dark:text-content-dark">
        Redirecting to Discord...
      </p>
    </main>
  );
}
