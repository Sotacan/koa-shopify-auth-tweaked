import {Context} from 'koa';

import createTopLevelRedirect from './create-top-level-redirect';

import {TOP_LEVEL_OAUTH_COOKIE_NAME} from './index';

export default function createTopLevelOAuthRedirect(path: string) {
  return async function topLevelOAuthRedirect(ctx: Context) {
    ctx.cookies.set(TOP_LEVEL_OAUTH_COOKIE_NAME, '1');
    setTimeout(() => {
      const redirect = createTopLevelRedirect(path);
      //redirect(ctx);
    }, 75);
  };
}
