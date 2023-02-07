import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const UsersSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["User", "Admin"], default: "User" },
  },
  { timestamps: true }
);

UsersSchema.pre("save", async function (next) {
  const currentUser = this;

  if (currentUser.isModified("password")) {
    const plainPW = currentUser.password;

    const hash = await bcrypt.hash(plainPW, 11);
    currentUser.password = hash;
  }

  next();
});

UsersSchema.methods.toJSON = function () {
  const userDocument = this;
  const user = userDocument.toObject();

  delete user.password;
  delete user.createdAt;
  delete user.updatedAt;
  delete user.__v;
  return user;
};

UsersSchema.static("checkCredentials", async function (email, password) {
  // 1. Find by email
  const user = await this.findOne({ email }); //"this" here represents the User Model

  if (user) {
    // 2. If the user is found --> compare plain password with the hashed one
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // 3. If passwords they match --> return user

      return user;
    } else {
      // 4. If they don't --> return null
      return null;
    }
  } else {
    // 5. In case of user not found --> return null
    return null;
  }
});

export default model("User", UsersSchema);
