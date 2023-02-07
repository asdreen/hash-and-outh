import mongoose from "mongoose";

const { Schema, model } = mongoose;

const blogPostSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String, required: true },
    readTime: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    content: { type: String, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: "Users" }],
  },
  {
    timestamps: true,
  }
);

blogPostSchema.static("findBlogPostsWithUsers", async function (query) {
  const total = await this.countDocuments(query.criteria);
  const blogPosts = await this.find(query.criteria, query.options.fields)
    .limit(query.options.limit)
    .skip(query.options.skip)
    .sort(query.options.sort);
  return { blogPosts, total };
});

export default model("BlogPost", blogPostSchema);
