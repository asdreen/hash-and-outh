import express from "express";
import BlogPostModel from "./model.js";
import createHttpError from "http-errors";
import { basicAuthMiddleware } from "../../lib/auth/basicAuth.js";

const blogPostsRouter = express.Router();

// POST

blogPostsRouter.post("/", basicAuthMiddleware, async (req, res, next) => {
  try {
    const newBlogPost = new BlogPostModel(req.body);
    const { _id } = await newBlogPost.save();

    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

// GET

blogPostsRouter.get("/", async (req, res, next) => {
  try {
    const blogPosts = await BlogPostModel.find({});
    res.send(blogPosts);
  } catch (error) {
    next(error);
  }
});

// GET POSTS WITH AUTHOR

blogPostsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);

    const { blogPosts, total } = await BlogPostModel.findBlogPostsWithAuthors(
      mongoQuery
    );

    res.send({
      links: mongoQuery.links("http://localhost:3001/blogPosts", total),
      total,
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      blogPosts,
    });
  } catch (error) {
    next(error);
  }
});

// GET SPECIFIC

blogPostsRouter.get("/:blogPostId", async (req, res, next) => {
  try {
    const blogPost = await BlogPostModel.findById(
      req.params.blogPostId
    ).populate({ path: "authors", select: "name surname avatar" });
    if (blogPost) {
      res.send(blogPost);
    } else {
      next(
        createHttpError(404, `User with id ${req.params.blogPostId} not found`)
      );
    }
  } catch (error) {
    next(error);
  }
});

// PUT

blogPostsRouter.put(
  "/:blogPostId",
  basicAuthMiddleware,
  async (req, res, next) => {
    try {
      const updatedBlogPost = await BlogPostModel.findByIdAndUpdate(
        req.params.blogPostId,
        req.body,
        { new: true, runValidators: true }
      );

      if (updatedBlogPost) {
        res.send(updatedBlogPost);
      } else {
        next(
          createHttpError(
            404,
            `User with id ${req.params.blogPostId} not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

// DELETE

blogPostsRouter.delete(
  "/:blogPostId",
  basicAuthMiddleware,
  async (req, res, next) => {
    try {
      const deletedBlogPost = await BlogPostModel.findByIdAndDelete(
        req.params.blogPostId
      );
      if (deletedBlogPost) {
        res.status(204).send();
      } else {
        next(
          createHttpError(
            404,
            `User with id ${req.params.blogPostId} not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default blogPostsRouter;
