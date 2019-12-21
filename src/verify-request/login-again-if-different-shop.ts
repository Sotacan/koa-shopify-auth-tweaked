import {Context} from 'koa';

import {NextFunction} from '../types';

import {Routes} from './types';
import {clearSession, redirectToAuth} from './utilities';

export function loginAgainIfDifferentShop(routes: Routes) {
  return async function loginAgainIfDifferentShopMiddleware(
    ctx: Context,
    next: NextFunction,
  ) {
    const {query, session} = ctx;

    if (session && query.shop && session.shop !== query.shop) {
      console.log("LA2 True: session && query.shop && session.shop !== query.shop");
      clearSession(ctx);
      //redirectToAuth(routes, ctx);
      return;
    } else {
      console.log("LA2 False: session && query.shop && session.shop !== query.shop");
    }

    await next();
  };
}
