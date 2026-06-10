import { defineConfig } from '@ice/app';
import icestark from '@ice/plugin-icestark';
import standards from '@ali/ice-plugin-standards';
import superPlugins from '@ali/aone-super-plugins';

export default defineConfig(() => ({
  ssg: false,
  ssr: false,
  codeSplitting: false,
  publicPath: '/healthy/',
  plugins: [
    icestark({ type: 'child' }),
    standards({
      disableExternalScripts: process.env.NODE_ENV === 'production',
    }),
    superPlugins({
      framework: 'ice3',
    }),
  ],
  devPublicPath: '/',
}));
