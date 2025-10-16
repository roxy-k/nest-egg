import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "./models/User.js";
import jwt from "jsonwebtoken";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK,
  JWT_SECRET = "dev_secret",
} = process.env;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = (profile.emails?.[0]?.value || "").toLowerCase();
        const googleId = profile.id;
        const name = profile.displayName || "";
        const avatar = profile.photos?.[0]?.value || "";

        let user = await User.findOne({ $or: [{ googleId }, { email }] });
        if (!user) {
          user = await User.create({ email, googleId, name, avatar, passwordHash: "" });
        } else {
          if (!user.googleId) user.googleId = googleId;
          if (name && user.name !== name) user.name = name;
          if (avatar && user.avatar !== avatar) user.avatar = avatar;
          await user.save();
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        done(null, { id: user._id, email: user.email, name: user.name, token });
      } catch (err) {
        done(err);
      }
    }
  )
);

export default passport;
