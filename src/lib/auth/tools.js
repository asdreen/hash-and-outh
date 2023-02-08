import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import UsersModel from "../../api/users/model.js";

export const createTokens = async (user) => {
  // 1. Given the user, it creates 2 tokens (access token & refresh token)
  const accessToken = await createAccessToken({
    _id: user._id,
    role: user.role,
  });
  const refreshToken = await createRefreshToken({ _id: user._id });

  // 2. Refresh token should be saved in db
  user.refreshToken = refreshToken;
  await user.save();

  // 3. Return the tokens
  return { accessToken, refreshToken };
};

const createAccessToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    )
  );

export const verifyAccessToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, originalPayload) => {
      if (err) reject(err);
      else resolve(originalPayload);
    })
  );

const createRefreshToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.REFRESH_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    )
  );

export const verifyRefreshToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.REFRESH_SECRET, (err, originalPayload) => {
      if (err) reject(err);
      else resolve(originalPayload);
    })
  );

export const verifyRefreshAndCreateNewTokens = async (currentRefreshToken) => {
  try {
    // 1. Check the integrity and expiration date of refresh token. We gonna catch potential errors
    const { _id } = await verifyRefreshToken(currentRefreshToken);

    // 2. If the token is valid, let's compare it with the one we have in db
    const user = await UsersModel.findById(_id);
    if (!user) throw new createHttpError(404, `User with id ${_id} not found!`);

    if (user.refreshToken && user.refreshToken === currentRefreshToken) {
      // 3. If everything is fine --> create 2 new tokens (saving refresh in db)
      const { accessToken, refreshToken } = await createTokens(user);
      // 4. Return the tokens
      return { accessToken, refreshToken };
    } else {
      throw new createHttpError(401, "Refresh token not valid!");
    }
  } catch (error) {
    // 5. In case of errors --> catch'em and send 401
  }
};
