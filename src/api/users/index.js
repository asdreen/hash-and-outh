import express from "express";
import createHttpError from "http-errors";
import { adminOnlyMiddleware } from "../../lib/auth/adminOnly.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwtAuth.js";
import BlogPostModel from "../blogPosts/model.js";
import UsersModel from "./model.js";
import passport from "passport";
import { createAccessToken } from "../../lib/auth/tools.js";

const usersRouter = express.Router();

// POST

usersRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

// GET

usersRouter.get(
  "/",
  JWTAuthMiddleware,

  async (req, res, next) => {
    try {
      const users = await UsersModel.find({});
      res.send(users);
    } catch (error) {
      next(error);
    }
  }
);

// GET GOOGLE LOGIN
usersRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
// The purpose of this endpoint is to redirect users to Google Consent Screen

// GET GOOGLE REDIRECT

usersRouter.get(
  "/googleRedirect",
  passport.authenticate("google", { session: false }),
  async (req, res, next) => {
    console.log(req.user);
    res.redirect(`${process.env.FE_URL}?accessToken=${req.user.accessToken}`);
  }
);

//GET ME

usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id);
    res.send(user);
  } catch (error) {
    next(error);
  }
});

// GET ME STORIES

usersRouter.get("/me/stories", async (req, res, next) => {
  try {
    const blogPosts = await BlogPostModel.find({ users: req.user._id });

    res.send(blogPosts);
  } catch (error) {
    next(error);
  }
});

// PUT ME

usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.user._id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    res.send(updatedUser);
  } catch (error) {
    next(error);
  }
});

// DELETE ME

usersRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await UsersModel.findByIdAndUpdate(req.user._id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET SPECIFIC

usersRouter.get("/:userId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);
    res.send(user);
  } catch (error) {
    next(error);
  }
});

// PUT

usersRouter.put(
  "/:userId",
  JWTAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
    } catch (error) {
      next(error);
    }
  }
);

// DELETE

usersRouter.delete(
  "/:userId",
  JWTAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
    } catch (error) {
      next(error);
    }
  }
);

// LOGIN TOKEN

usersRouter.post("/login", async (req, res, next) => {
  try {
    // 1. Obtain the credentials from req.body
    const { email, password } = req.body;

    // 2. Verify the credentials
    const user = await UsersModel.checkCredentials(email, password);

    if (user) {
      // 3.1 If credentials are fine --> generate an access token (JWT) and a refresh token and send them back as a response
      const payload = { _id: user._id, role: user.role };

      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    } else {
      // 3.2 If credentials are NOT fine --> trigger a 401 error
      next(createHttpError(401, "Credentials are not ok!"));
    }
  } catch (error) {
    next(error);
  }
});

// REFRESH TOKEN

usersRouter.post("/refreshTokens", async (req, res, next) => {
  try {
    const { currentRefreshToken } = req.body;

    const { accessToken, refreshToken } = await verifyRefreshAndCreateNewTokens(
      currentRefreshToken
    );

    res.send({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

// REGISTER TOKEN

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUserPre = {
      ...req.body,
      avatar: `https://ui-avatars.com/api/?name=${req.body.name}+${req.body.surname}`,
    };
    const newUser = new UsersModel(newUserPre);
    const { _id } = await newUser.save();

    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

export default usersRouter;
