export default function Custom404() {
  return (
    <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-contentSecondary-light dark:text-contentSecondary-dark">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-content-light dark:text-content-dark sm:text-5xl">
          Page not found
        </h1>

        <p className="mt-6 text-base leading-7 dark:text-contentSecondary-dark">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/"
            className={`
              w-9/12 rounded-md
              bg-primary-600
              px-3.5
              py-2.5 text-sm font-semibold 
              text-control-light 
              shadow-sm transition-colors 
              active:scale-[0.99] 
              dark:bg-primary-600 
              dark:text-surfaceContent-dark 
              dark:hover:bg-accentHighlight-dark
          `}
          >
            Go back home
          </a>
        </div>
      </div>
    </main>
  );
}
