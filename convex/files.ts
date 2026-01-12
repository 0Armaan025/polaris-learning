import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { verifyAuth } from "./auth";
import { Id } from "./_generated/dataModel";


export const getFiles = query({
  args: {
    projectId: v.id("projects")
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project) {
      throw new Error("you can't access this, project not found");
    }
    if (project.ownerId !== identity.subject) {
      throw new Error("not have access");
    }
    return await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

  }
});


//first one finished
//

export const getFile = query({
  args: {
    id: v.id("files")
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.id);

    if (!file) {
      throw new Error("you can't access this, file not found");
    }

    return file;

  }
});


export const getFolderContents = query({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error("project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("no access");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("parentId", args.parentId)
      )
      .collect();
    //folders -> files, alphabetically


    return files.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return -1;

      return a.name.localeCompare(b.name);
    })
  },
});

export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error("project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("no access");
    }

    // check if same file exists



    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("parentId", args.parentId)
      )
      .collect();
    //folders -> files, alphabetically

    const existing = files.find((file) => file.name === args.name && file.type === "file");

    if (existing) {
      throw new Error("same file already exists...");
    }

    await ctx.db.insert("files", {
      projectId: args.projectId,

      name: args.name,
      content: args.content,
      type: "file",
      parentId: args.parentId,
      updatedAt: Date.now(),
    });
    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });
  },

});


export const createFolder = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error("project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("no access");
    }

    // check if same folder exists



    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("parentId", args.parentId)
      )
      .collect();
    //folders -> files, alphabetically

    const existing = files.find((file) => file.name === args.name && file.type === "folder");

    if (existing) {
      throw new Error("same folder already exists...");
    }

    await ctx.db.insert("files", {
      projectId: args.projectId,

      name: args.name,
      type: "folder",
      parentId: args.parentId,
      updatedAt: Date.now(),
    });
    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });
  },

});

export const renameFile = mutation({
  args: {
    id: v.id('files'),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.id);

    if (!file) {
      throw new Error("file not exstiing");
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project) {
      throw new Error("project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("unauthroized");
    }

    // check if a file with the new name already exists int he same parent folder



    const siblings = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) => q.eq("projectId", file.projectId).eq("parentId", file.parentId))
      .collect();

    const existing = siblings.find((sibling) => sibling.name === args.newName && sibling.type === file.type && sibling._id !== args.id);


    if (existing) {
      throw new Error("a file name with same type already exists, die anyways armaan, its too much");
    }

    //update file's naem

    await ctx.db.patch("files", args.id, {
      name: args.newName,
      updatedAt: Date.now(),
    });
    await ctx.db.patch("projects", file.projectId, {
      updatedAt: Date.now(),
    });
  }

})




export const deleteFile = mutation({
  args: {
    id: v.id('files'),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.id);

    if (!file) {
      throw new Error("file not exstiing");
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project) {
      throw new Error("project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("unauthroized");
    }


    const deleteRecursive = async (fileId: Id<"files">) => {
      const item = await ctx.db.get("files", fileId);

      if (!item) {
        return;
      }

      // if a folder
      if (item.type == "folder") {
        const children = await ctx.db
          .query("files")
          .withIndex("by_project_parent", (q) => q.eq("projectId", item.projectId).eq("parentId", fileId)).collect();
        for (const child of children) {
          await deleteRecursive(child._id);
        }

      }


      // delete storage file
      if (item.storageId) {
        await ctx.storage.delete(item.storageId);
      }
    }

    await deleteRecursive(args.id);

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: Date.now(),
    });
  }

})

export const updateFile = mutation({

  args: {
    id: v.id('files'),
    content: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.id);

    if (!file) {
      throw new Error("file not exstiing");
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project) {
      throw new Error("project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("unauthroized");
    }

    const now = Date.now();

    await ctx.db.patch("files", args.id, {
      content: args.content,
      updatedAt: now
    });

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: now,
    });

  }
});

