import { Meta, Title, Links, Main, Scripts } from 'ice';

export default function Document() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="description" content="icestark framework scaffold" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <Meta />
        <Title />
        <Links />
      </head>
      <body>
        <svg style={{ display: 'none' }}>
          <defs>
            <filter id="liquid-distort" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves={2} result="fluid-noise" />
              <feGaussianBlur in="fluid-noise" stdDeviation={3} result="blurred-noise" />
              <feDisplacementMap in="SourceGraphic" in2="blurred-noise" scale={20} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <Main />
        <Scripts />
      </body>
    </html>
  );
}
