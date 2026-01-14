declare module "matomo-tracker" {
  interface TrackOptions {
    url?: string;
    action_name?: string;
    ua?: string;
    cip?: string;
    cvar?: string;
    cvar2?: string;
    [key: string]: string | number | undefined;
  }

  class MatomoTracker {
    constructor(siteId: number, matomoUrl: string);
    track(options: TrackOptions): void;
  }

  export = MatomoTracker;
}
