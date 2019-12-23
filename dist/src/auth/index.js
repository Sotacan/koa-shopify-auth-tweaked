"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var create_oauth_start_1 = tslib_1.__importDefault(require("./create-oauth-start"));
var create_oauth_callback_1 = tslib_1.__importDefault(require("./create-oauth-callback"));
var create_enable_cookies_1 = tslib_1.__importDefault(require("./create-enable-cookies"));
var create_enable_cookies_redirect_1 = tslib_1.__importDefault(require("./create-enable-cookies-redirect"));
var create_top_level_oauth_redirect_1 = tslib_1.__importDefault(require("./create-top-level-oauth-redirect"));

var DEFAULT_MYSHOPIFY_DOMAIN = 'myshopify.com';
var DEFAULT_ACCESS_MODE = 'online';
exports.TOP_LEVEL_OAUTH_COOKIE_NAME = 'shopifyTopLevelOAuth';
exports.TEST_COOKIE_NAME = 'shopifyTestCookie';
function hasCookieAccess(_a) {
    var cookies = _a.cookies;
    return Boolean(cookies.get(exports.TEST_COOKIE_NAME));
}
function shouldPerformInlineOAuth(_a) {
    var cookies = _a.cookies;
    return Boolean(cookies.get(exports.TOP_LEVEL_OAUTH_COOKIE_NAME));
}
//Start
var KoaSessionFirebase = {
  set: async (key, val, ctx, SessionStore, COOKIE_CONFIG) => {
    if(
      !ctx ||
      !SessionStore ||
      !COOKIE_CONFIG
    ) return;
    var ourSessionKey = 
    ctx.cookies.get("__session");
    if(!ourSessionKey) {
      ourSessionKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      ctx.cookies
        .set("__session", ourSessionKey);
    }
    await SessionStore.set(ourSessionKey, {
      [key]: val,
      "_expire": Date.now() + COOKIE_CONFIG.maxAge,
      "_maxAge": COOKIE_CONFIG.maxAge
    });
  },
  get: async (key=null, ctx, SessionStore, COOKIE_CONFIG) => {
    if(
      !ctx ||
      !SessionStore ||
      !COOKIE_CONFIG
    ) return;
    var ourSessionKey = 
      ctx.cookies.get("__session");
    if(ourSessionKey) {
      var sessionData = 
        await SessionStore
          .get(ourSessionKey, COOKIE_CONFIG.maxAge);
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
function createShopifyAuth(options) {
    var config = tslib_1.__assign({ scopes: [], prefix: '/next', myShopifyDomain: DEFAULT_MYSHOPIFY_DOMAIN, accessMode: DEFAULT_ACCESS_MODE, firebaseAdmin: null }, options);
    var prefix = config.prefix;
    //Start
    const { FirestoreStore } = require("koa-session-firestore");
    if(!FirestoreStore) console.log('FirestoreStore undefined');
    var {firebaseAdmin} = config;
    if(!firebaseAdmin) console.log('firebaseAdmin undefined');
    const firestore = firebaseAdmin.firestore();
    if(!firestore) console.log('firestore undefined');
    var FirestoreKoaSession = new FirestoreStore({ db: firestore });
    if(!FirestoreKoaSession) console.log('FirestoreKoaSession undefined');
    //End
    var oAuthStartPath = prefix + "/auth";
    var oAuthCallbackPath = oAuthStartPath + "/callback";
    var oAuthStart = create_oauth_start_1.default(config, oAuthCallbackPath);
    var oAuthCallback = create_oauth_callback_1.default(config);
    var inlineOAuthPath = prefix + "/auth/inline";
    var topLevelOAuthRedirect = create_top_level_oauth_redirect_1.default(inlineOAuthPath);
    var enableCookiesPath = oAuthStartPath + "/enable_cookies";
    var enableCookies = create_enable_cookies_1.default(config);
    var enableCookiesRedirect = create_enable_cookies_redirect_1.default(enableCookiesPath);
    return async function shopifyAuth(ctx, next) {
        //Start
        const COOKIE_CONFIG = { maxAge: 86400000 };
        var SessionStore = FirestoreKoaSession;
        ctx.session = await KoaSessionFirebase.get(null, ctx, SessionStore, COOKIE_CONFIG);
        //End
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(ctx.path === oAuthStartPath && !hasCookieAccess(ctx))) {
                            return [3 /*break*/, 2];
                        }
                        return [4 /*yield*/, enableCookiesRedirect(ctx)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        if (!(ctx.path === inlineOAuthPath ||
                            (ctx.path === oAuthStartPath && shouldPerformInlineOAuth(ctx))))
                        {
                                return [3 /*break*/, 4];
                        }
                        return [4 /*yield*/, oAuthStart(ctx)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                    case 4:
                        if (!(ctx.path === oAuthStartPath)) {
                            return [3 /*break*/, 6];
                        }
                        return [4 /*yield*/, topLevelOAuthRedirect(ctx)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                    case 6:
                        if (!(ctx.path === oAuthCallbackPath)) return [3 /*break*/, 8];
                        return [4 /*yield*/, oAuthCallback(ctx)];
                    case 7:
                        _a.sent();
                        return [2 /*return*/];
                    case 8:
                        if (!(ctx.path === enableCookiesPath)) return [3 /*break*/, 10];
                        return [4 /*yield*/, enableCookies(ctx)];
                    case 9:
                        _a.sent();
                        return [2 /*return*/];
                    case 10: return [4 /*yield*/, next()];
                    case 11:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
}
exports.default = createShopifyAuth;
var errors_1 = require("./errors");
exports.Error = errors_1.default;
var validate_hmac_1 = require("./validate-hmac");
exports.validateHMAC = validate_hmac_1.default;
