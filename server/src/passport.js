// server/src/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "./models/User.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "https://nest-egg-tuwf.onrender.com/api/auth/google/callback";

const shouldRegisterGoogle =
  Boolean(CLIENT_ID && CLIENT_SECRET && CALLBACK_URL) && process.env.NODE_ENV !== "test";

if (!shouldRegisterGoogle) {
  if (process.env.NODE_ENV !== "test") {
    console.warn("⚠️ Google OAuth disabled: missing CLIENT_ID/CLIENT_SECRET or callback URL");
  }
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = (profile.emails?.[0]?.value || "").toLowerCase().trim();
          if (!email) return done(null, false, { message: "No email from Google" });

          const googleId = profile.id;
          const name = profile.displayName || "";
          const avatar = profile.photos?.[0]?.value || "";

          let user =
            (await User.findOne({ googleId })) ||
            (await User.findOne({ email }));

          if (!user) {
            user = await User.create({
              email,
              googleId,
              name,
              avatar,
              provider: "google",
              passwordHash: "",
            });
          } else {
            if (!user.googleId) user.googleId = googleId;
            if (name && user.name !== name) user.name = name;
            if (avatar && user.avatar !== avatar) user.avatar = avatar;
            if (!user.provider) user.provider = "google";
            await user.save();
          }

          return done(null, { id: user._id, email: user.email, name: user.name });
        } catch (err) {
          console.error("GoogleStrategy error:", err);
          return done(err);
        }
      },
    ),
  );
}

export default passport;
