import { env } from "~/env.mjs";
import { Link } from "./Link";

function getVersionData(): { url: string; label: string } {
  if (env.NEXT_PUBLIC_BLOBSCAN_RELEASE) {
    return {
      url: `https://github.com/Blobscan/blobscan/releases/tag/${env.NEXT_PUBLIC_BLOBSCAN_RELEASE}`,
      label: env.NEXT_PUBLIC_BLOBSCAN_RELEASE,
    };
  }

  if (env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA) {
    return {
      url: `https://github.com/Blobscan/blobscan/commit/${env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}`,
      label: env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7),
    };
  }

  return {
    url: "https://github.com/Blobscan/blobscan/",
    label: "Development",
  };
}

export const BlobscanVersionInfo: React.FC = () => {
  const { url, label } = getVersionData();

  return (
    <div className="flex items-center gap-1">
      <div className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
        Version:
      </div>
      <div className="relative">
        <Link href={url} isExternal>
          <div className="relative -top-0.5 text-xs">{label}</div>
        </Link>
      </div>
    </div>
  );
};
