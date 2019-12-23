"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var create_oauth_start_1 = tslib_1.__importDefault(require("./create-oauth-start"));
var create_oauth_callback_1 = tslib_1.__importDefault(require("./create-oauth-callback"));
var create_enable_cookies_1 = tslib_1.__importDefault(require("./create-enable-cookies"));
var create_enable_cookies_redirect_1 = tslib_1.__importDefault(require("./create-enable-cookies-redirect"));
var create_top_level_oauth_redirect_1 = tslib_1.__importDefault(require("./create-top-level-oauth-redirect"));
//Start
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { FirestoreStore } = require("koa-session-firestore");
var firebaseAdmin = admin.initializeApp(functions.config().firebase);;
const firestore = firebaseAdmin.firestore();
var FirestoreKoaSession = new FirestoreStore({ db: firestore });
//End
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
function async createShopifyAuth(options) {
    var config = tslib_1.__assign({ scopes: [], prefix: '/next', myShopifyDomain: DEFAULT_MYSHOPIFY_DOMAIN, accessMode: DEFAULT_ACCESS_MODE }, options);
    var prefix = config.prefix;
    var oAuthStartPath = prefix + "/auth";
    var oAuthCallbackPath = oAuthStartPath + "/callback";
    var oAuthStart = create_oauth_start_1.default(config, oAuthCallbackPath);
    var oAuthCallback = create_oauth_callback_1.default(config);
    var inlineOAuthPath = prefix + "/auth/inline";
    var topLevelOAuthRedirect = create_top_level_oauth_redirect_1.default(inlineOAuthPath);
    var enableCookiesPath = oAuthStartPath + "/enable_cookies";
    var enableCookies = create_enable_cookies_1.default(config);
    var enableCookiesRedirect = create_enable_cookies_redirect_1.default(enableCookiesPath);
    return function shopifyAuth(ctx, next) {
    //Start
    KoaSessionFirebase.COOKIE_CONFIG = { maxAge: 86400000 };
    KoaSessionFirebase.SessionStore = FirestoreKoaSession;
    KoaSessionFirebase.ctx = ctx;
    ctx.session = await KoaSessionFirebase.get();
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
