import {betterAuth} from "better-auth";
import {
  CANONICAL_ORIGIN,CANONICAL_AUTH_PATH,CANONICAL_COOKIE_PREFIX,
  canonicalConfigState,permitCanonicalUserCreation
} from "./policy.mjs";

/**
 * Isolated staging Better Auth factory. No V5 imports, shared sessions,
 * privileged roles, Creator V1 writes, RHEN or broker authorization.
 *
 * The engine's user.create database hook rejects all unknown and non-invited
 * identities. An existing session is NOT proof of a Creator V1 member link.
 */
export function canonicalAuthOptions(env){
  const stage=canonicalConfigState(env);
  if(!stage.operational)throw new Error("Canonical staging identity disabled");
  return {
    appName:"ANEVUM Canonical Identity — Staging",
    baseURL:CANONICAL_ORIGIN,
    basePath:CANONICAL_AUTH_PATH,
    secret:env.CANONICAL_BETTER_AUTH_SECRET,
    database:env.MEMBER_DB,
    emailAndPassword:{enabled:false},
    socialProviders:{
      google:{
        clientId:env.CANONICAL_GOOGLE_CLIENT_ID,
        clientSecret:env.CANONICAL_GOOGLE_CLIENT_SECRET,
        scope:["email","profile"],
        requireEmailVerification:true,
        disableSignUp:!stage.invited,
        disableImplicitSignUp:!stage.invited
      }
    },
    databaseHooks:{
      user:{
        create:{
          before:async user=>
            permitCanonicalUserCreation(env,user?.email)?{data:user}:false
        }
      }
    },
    account:{
      encryptOAuthTokens:true,
      storeStateStrategy:"database",
      accountLinking:{disableImplicitLinking:true}
    },
    trustedOrigins:[CANONICAL_ORIGIN],
    advanced:{
      useSecureCookies:true,
      cookiePrefix:CANONICAL_COOKIE_PREFIX,
      // No crossSubDomainCookies: the default confines sessions to a.anevum.com
      ipAddress:{ipAddressHeaders:["cf-connecting-ip"]}
    },
    session:{freshAge:600},
    rateLimit:{
      enabled:true,storage:"database",window:60,max:20,
      customRules:{
        "/sign-in/social":{window:60,max:5}
      }
    }
  };
}

export function createCanonicalAuth(env,factory=betterAuth){
  return factory(canonicalAuthOptions(env));
}
