import {Context} from 'koa';

import {OAuthStartOptions, AccessMode, NextFunction} from '../types';

import createOAuthStart from './create-oauth-start';
import createOAuthCallback from './create-oauth-callback';
import createEnableCookies from './create-enable-cookies';
import createEnableCookiesRedirect from './create-enable-cookies-redirect';
import createTopLevelOAuthRedirect from './create-top-level-oauth-redirect';

//Start
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { FirestoreStore } = require("koa-session-firestore");

var firebaseAdmin = admin.initializeApp(functions.config().firebase);;
const firestore = firebaseAdmin.firestore();
var FirestoreKoaSession = new FirestoreStore({ db: firestore });
//End

const DEFAULT_MYSHOPIFY_DOMAIN = 'myshopify.com';
const DEFAULT_ACCESS_MODE: AccessMode = 'online';

export const TOP_LEVEL_OAUTH_COOKIE_NAME = 'shopifyTopLevelOAuth';
export const TEST_COOKIE_NAME = 'shopifyTestCookie';

function hasCookieAccess({cookies}: Context) {
  return Boolean(cookies.get(TEST_COOKIE_NAME));
}

function shouldPerformInlineOAuth({cookies}: Context) {
  return Boolean(cookies.get(TOP_LEVEL_OAUTH_COOKIE_NAME));
}

//Start
var KoaSessionFirebase = {
  ctx: null,
  SessionStore: null,
  COOKIE_CONFIG: null,
  set: async (key, val) => {
    if(
      !this.ctx ||
      !this.SessionStore ||
      !this.COOKIE_CONFIG
    ) return;
    var ourSessionKey = 
      this.ctx.cookies.get("__session");
    if(!ourSessionKey) {
      ourSessionKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      this.ctx.cookies
        .set("__session", ourSessionKey);
    }
    await this.SessionStore.set(ourSessionKey, {
      [key]: val,
      "_expire": Date.now() + this.COOKIE_CONFIG.maxAge,
      "_maxAge": this.COOKIE_CONFIG.maxAge
    });
  },
  get: async (key=null) => {
    if(
      !this.ctx ||
      !this.SessionStore ||
      !this.COOKIE_CONFIG
    ) return;
    var ourSessionKey = 
      this.ctx.cookies.get("__session");
    if(ourSessionKey) {
      var sessionData = 
        await this.SessionStore
          .get(ourSessionKey, this.COOKIE_CONFIG.maxAge);
      if(key && sessionData && sessionData[key]) {
          return sessionData[key];
      } else if(sessionData) {
        return sessionData;
      }
    }
    return {};
  }
};
//End

export default function createShopifyAuth(options: OAuthStartOptions) {
  const config = {
    scopes: [],
    prefix: '/',
    myShopifyDomain: DEFAULT_MYSHOPIFY_DOMAIN,
    accessMode: DEFAULT_ACCESS_MODE,
    ...options,
  };

  const {prefix} = config;

  const oAuthStartPath = `${prefix}/auth`;
  const oAuthCallbackPath = `${oAuthStartPath}/callback`;

  const oAuthStart = createOAuthStart(config, oAuthCallbackPath);
  const oAuthCallback = createOAuthCallback(config);

  const inlineOAuthPath = `${prefix}/auth/inline`;
  const topLevelOAuthRedirect = createTopLevelOAuthRedirect(inlineOAuthPath);

  const enableCookiesPath = `${oAuthStartPath}/enable_cookies`;
  const enableCookies = createEnableCookies(config);
  const enableCookiesRedirect = createEnableCookiesRedirect(enableCookiesPath);

  return async function shopifyAuth(ctx: Context, next: NextFunction) {
    //Start
    KoaSessionFirebase.COOKIE_CONFIG = { maxAge: 86400000 };
    KoaSessionFirebase.SessionStore = FirestoreKoaSession;
    KoaSessionFirebase.ctx = ctx;

    ctx.session = await KoaSessionFirebase.get();
    //End

    if (ctx.path === oAuthStartPath && !hasCookieAccess(ctx)) {
      await enableCookiesRedirect(ctx);
      return;
    }

    if (
      ctx.path === inlineOAuthPath ||
      (ctx.path === oAuthStartPath && shouldPerformInlineOAuth(ctx))
    ) {
      await oAuthStart(ctx);
      return;
    }

    if (ctx.path === oAuthStartPath) {
      await topLevelOAuthRedirect(ctx);
      return;
    }

    if (ctx.path === oAuthCallbackPath) {
      await oAuthCallback(ctx);
      return;
    }

    if (ctx.path === enableCookiesPath) {
      await enableCookies(ctx);
      return;
    }

    await next();
  };
}

export {default as Error} from './errors';
export {default as validateHMAC} from './validate-hmac';
