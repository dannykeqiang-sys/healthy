import { defineAppConfig } from 'ice';
import { defineChildConfig } from '@ice/plugin-icestark/types';
import { aesInit } from '@ali/mkt-universal-aes';

export const icestark = defineChildConfig(() => {
  return {
    mount: () => {
      try {
        if (window?.__IDEA_APP_LOADER__?.microAppName) {
          aesInit({
            pid: `apps-${window?.__IDEA_APP_LOADER__?.microAppName}`,
          }); 
        }
      }
      catch (error) {
        console.error('aesInit error', error);
      }
      console.log('mount');
    },
    unmount: () => {
      console.log('unmount');
    },
  };
});

export default defineAppConfig(() => ({
  // See more details in https://ice3.alibaba-inc.com/v3/docs/guide/basic/app#%E9%85%8D%E7%BD%AE%E9%A1%B9
}));
