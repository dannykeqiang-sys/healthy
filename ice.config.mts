import { defineConfig } from '@ice/app';
import icestark from '@ice/plugin-icestark';

export default defineConfig(() => ({
  ssg: false,
  ssr: false,
  codeSplitting: false,
  publicPath: '/healthy/',
  plugins: [
    icestark({ type: 'child' }),
  ],
  devPublicPath: '/',
}));
