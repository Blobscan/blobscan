import { EnvelopeIcon } from "@heroicons/react/24/outline";

import { Card } from "~/components/Cards/Card";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import DiscordIcon from "~/icons/discord.svg";
import FarcasterIcon from "~/icons/farcaster.svg";
import XIcon from "~/icons/x.svg";

const EMAIL = "contact@blobscan.com";

export default function Contact() {
  return (
    <div className="flex flex-col gap-8">
      <Header>Contact Us</Header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex flex-col items-center gap-4 py-4">
            <EnvelopeIcon className="h-10 w-10 text-content-light dark:text-content-dark" />
            <h2 className="text-lg font-semibold text-content-light dark:text-content-dark">
              Email
            </h2>
            <Link href={`mailto:${EMAIL}`} isExternal hideExternalIcon>
              {EMAIL}
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center gap-4 py-4">
            <DiscordIcon className="h-10 w-10 text-content-light dark:text-content-dark" />
            <h2 className="text-lg font-semibold text-content-light dark:text-content-dark">
              Discord
            </h2>
            <Link href="/discord">Join our Discord server</Link>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center gap-4 py-4">
            <XIcon className="h-10 w-10 text-content-light dark:text-content-dark" />
            <h2 className="text-lg font-semibold text-content-light dark:text-content-dark">
              X
            </h2>
            <Link href="https://x.com/blobscan" isExternal>
              @blobscan
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center gap-4 py-4">
            <FarcasterIcon className="h-10 w-10 text-content-light dark:text-content-dark" />
            <h2 className="text-lg font-semibold text-content-light dark:text-content-dark">
              Farcaster
            </h2>
            <Link href="https://farcaster.xyz/blobscan" isExternal>
              @blobscan
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
