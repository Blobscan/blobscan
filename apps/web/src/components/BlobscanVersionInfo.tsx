import { useEnv } from "~/providers/Env";
import { Link } from "./Link";

export const BlobscanVersionInfo: React.FC = () => {
  const { env } = useEnv();

  let url = "https://github.com/Blobscan/blobscan/";
  let label = "Development";

  if (env && env["PUBLIC_BLOBSCAN_RELEASE"]) {
    url = `https://github.com/Blobscan/blobscan/releases/tag/${env["PUBLIC_BLOBSCAN_RELEASE"]}`;
    label = env["PUBLIC_BLOBSCAN_RELEASE"] as string;
  }

  if (env && env["PUBLIC_VERCEL_GIT_COMMIT_SHA"]) {
    url = `https://github.com/Blobscan/blobscan/commit/${env["PUBLIC_VERCEL_GIT_COMMIT_SHA"]}`;
    label = (env["PUBLIC_VERCEL_GIT_COMMIT_SHA"] as string).slice(0, 7);
  }

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
