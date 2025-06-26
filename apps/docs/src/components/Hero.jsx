import { Button } from '@/components/Button'
import { HeroBackground } from '@/components/HeroBackground'
import blurFuchsiaImage from '@/images/blur-fuchsia.png'
import blurIndigoImage from '@/images/blur-indigo.png'
import clsx from 'clsx'
import Image from 'next/image'
import { Highlight } from 'prism-react-renderer'
import { Fragment } from 'react'

const codeLanguage = 'javascript'
const code = `{
  "blob": {
    "versionedHash": "0x0100...1368",
    "commitment": "0xb4f67eb0...3803b983"
  },
  "blobDataStorage": [{
    "storage": "GOOGLE",
    "reference": "1/01/00/0100...1368.bin"
  }]
}`

const tabs = [{ name: 'blob.json', isActive: true }]

function TrafficLightsIcon(props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 42 10" fill="none" {...props}>
      <circle cx="5" cy="5" r="4.5" />
      <circle cx="21" cy="5" r="4.5" />
      <circle cx="37" cy="5" r="4.5" />
    </svg>
  )
}

export function Hero() {
  return (
    <div className="overflow-hidden bg-slate-900 dark:-mb-32 dark:mt-[-5.40rem] dark:pb-32 dark:pt-[4.75rem]">
      <div className="py-16 sm:px-2 lg:relative lg:px-0 lg:py-20">
        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 px-4 lg:max-w-8xl lg:grid-cols-2 lg:px-8 xl:gap-x-16 xl:px-12">
          <div className="relative z-10 md:text-center lg:text-left">
            <Image
              className="absolute bottom-full right-full -mb-56 -mr-72 opacity-50"
              src={blurIndigoImage}
              alt=""
              width={530}
              height={530}
              unoptimized
              priority
            />
            <div className="relative">
              <p className="inline bg-gradient-to-r from-fuchsia-200 via-primary-400 to-fuchsia-200 bg-clip-text font-display text-5xl tracking-tight text-transparent">
                Explore all the blobs
              </p>
              <p className="mt-3 text-2xl tracking-tight text-slate-400">
                The pioneer blockchain explorer dedicated to navigate and
                visualize shard blob transactions.
              </p>
              <div className="mt-8 flex gap-4 md:justify-center lg:justify-start">
                <Button href="https://blobscan.com/">Visit explorer</Button>
                <Button href="https://github.com/Blobscan/" variant="secondary">
                  View on GitHub
                </Button>
              </div>
            </div>
          </div>
          <div className="relative lg:static xl:pl-10">
            <div className="absolute inset-x-[-50vw] -bottom-48 -top-32 [mask-image:linear-gradient(transparent,white,white)] dark:[mask-image:linear-gradient(transparent,white,transparent)] lg:-bottom-32 lg:-top-32 lg:left-[calc(50%+14rem)] lg:right-0 lg:[mask-image:none] lg:dark:[mask-image:linear-gradient(white,white,transparent)]">
              <HeroBackground className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-0 lg:translate-x-0 lg:translate-y-[-60%]" />
            </div>
            <div className="relative">
              <Image
                className="absolute -right-64 -top-64"
                src={blurIndigoImage}
                alt=""
                width={530}
                height={530}
                unoptimized
                priority
              />
              <Image
                className="absolute -bottom-40 -right-44"
                src={blurFuchsiaImage}
                alt=""
                width={567}
                height={567}
                unoptimized
                priority
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary-300 via-primary-300/70 to-fuchsia-300 opacity-10 blur-lg" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary-300 via-primary-300/70 to-fuchsia-300 opacity-10" />
              <div className="relative rounded-2xl bg-[#0A101F]/80 ring-1 ring-white/10 backdrop-blur">
                <div className="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-primary-300/0 via-primary-300/70 to-primary-300/0" />
                <div className="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-fuchsia-400/0 via-fuchsia-400 to-fuchsia-400/0" />
                <div className="pl-4 pt-4">
                  <TrafficLightsIcon className="h-2.5 w-auto stroke-slate-500/30" />
                  <div className="mt-4 flex space-x-2 text-xs">
                    {tabs.map((tab) => (
                      <div
                        key={tab.name}
                        className={clsx(
                          'flex h-6 rounded-full',
                          tab.isActive
                            ? 'bg-gradient-to-r from-primary-400/30 via-primary-400 to-primary-400/30 p-px font-medium text-primary-300'
                            : 'text-slate-500'
                        )}
                      >
                        <div
                          className={clsx(
                            'flex items-center rounded-full px-2.5',
                            tab.isActive && 'bg-slate-800'
                          )}
                        >
                          {tab.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-start px-1 text-sm">
                    <div
                      aria-hidden="true"
                      className="select-none border-r border-slate-300/5 pr-4 font-mono text-slate-600"
                    >
                      {Array.from({
                        length: code.split('\n').length,
                      }).map((_, index) => (
                        <Fragment key={index}>
                          {(index + 1).toString().padStart(2, '0')}
                          <br />
                        </Fragment>
                      ))}
                    </div>
                    <Highlight
                      code={code}
                      language={codeLanguage}
                      theme={{ plain: {}, styles: [] }}
                    >
                      {({
                        className,
                        style,
                        tokens,
                        getLineProps,
                        getTokenProps,
                      }) => (
                        <pre
                          className={clsx(
                            className,
                            'flex overflow-x-auto pb-6'
                          )}
                          style={style}
                        >
                          <code className="px-4">
                            {tokens.map((line, lineIndex) => (
                              <div key={lineIndex} {...getLineProps({ line })}>
                                {line.map((token, tokenIndex) => (
                                  <span
                                    key={tokenIndex}
                                    {...getTokenProps({ token })}
                                  />
                                ))}
                              </div>
                            ))}
                          </code>
                        </pre>
                      )}
                    </Highlight>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
