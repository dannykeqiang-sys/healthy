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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w, d, s, q) {
  w[q] = w[q] || [];
  var f = d.getElementsByTagName(s)[0],j = d.createElement(s);
  j.async = true;
  j.id = 'beacon-aplus';
  j.setAttribute('exparams','userid=&aplus&sidx=aplusSidex&ckx=aplusCkx');
  j.src = "//g.alicdn.com/alilog/mlog/aplus_v2.js";
  j.crossorigin = 'anonymous';
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'aplus_queue');`,
          }}
        />
      </head>
      <body>
        <Main />
        <Scripts />
      </body>
    </html>
  );
}
