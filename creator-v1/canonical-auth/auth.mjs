import {betterAuth} from "better-auth";
import {emailOTP} from "better-auth/plugins";
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
    socialProviders:stage.google?{
      google:{
        clientId:env.CANONICAL_GOOGLE_CLIENT_ID,
        clientSecret:env.CANONICAL_GOOGLE_CLIENT_SECRET,
        scope:["email","profile"],
        requireEmailVerification:true,
        disableSignUp:!stage.invited,
        disableImplicitSignUp:!stage.invited
      }
    }:{},
    plugins:stage.email?[emailOTP({
      otpLength:8,
      expiresIn:600,
      allowedAttempts:3,
      storeOTP:"hashed",
      disableSignUp:!stage.invited,
      async sendVerificationOTP({email,otp,type}){
        if(type!=="sign-in"||!permitCanonicalUserCreation(env,email))throw Error("OTP not permitted");
        const response=await fetch("https://api.resend.com/emails",{
          method:"POST",
          headers:{"Authorization":"Bearer "+env.CANONICAL_RESEND_API_KEY,
            "Content-Type":"application/json"},
          body:JSON.stringify({
            from:"ANEVUM <access@auth.anevum.com>",to:[email],
            subject:"Your ANEVUM sign-in code",
            text:`Your ANEVUM verification code is ${otp}. It expires in 10 minutes. If you did not request it, ignore this message.`,
            html:`<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;background:#111827;color:#f4e9d8;padding:28px;border-radius:20px"><p>ANEVUM / MEMBER ACCESS</p><h1>Verify your email</h1><p>Enter this code to sign in:</p><div style="font-size:32px;letter-spacing:7px;font-weight:700">${otp}</div><p>Expires in 10 minutes. Never share this code.</p></div>`
          }),
          signal:AbortSignal.timeout(7000)
        });
        if(!response.ok)throw Error("Email delivery unavailable");
      }
    })]:[],
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
        "/sign-in/social":{window:60,max:5},
        "/email-otp/send-verification-otp":{window:600,max:3},
        "/sign-in/email-otp":{window:60,max:5}
      }
    }
  };
}

export function createCanonicalAuth(env,factory=betterAuth){
  return factory(canonicalAuthOptions(env));
}
