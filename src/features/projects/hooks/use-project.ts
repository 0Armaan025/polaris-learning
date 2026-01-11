
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";

export const useProject = (projectId: Id<"projects">) => {
  return useQuery(api.projects.getById, { id: projectId });
};

export const useProjects = () => {
  return useQuery(api.projects.get);
};

export const useProjectPartial = (limit: number) => {
  return useQuery(api.projects.getPartial, { limit });
};

export const useCreateProject = () => {
  return useMutation(api.projects.create).withOptimisticUpdate(
    (localStore, args) => {
      const existingProjects = localStore.getQuery(api.projects.get);

      if (!existingProjects) return;


      const now = Date.now();
      const newProject = {
        _id: crypto.randomUUID() as Id<"projects">,
        _creationTime: now,
        name: args.name,
        ownerId: "anonymous",
        updatedAt: now,
      };

      localStore.setQuery(api.projects.get, {}, [
        newProject,
        ...existingProjects,
      ]);
    }
  );
};

export const useRenameProject = (projectId: Id<"projects">) => {
  return useMutation(api.projects.rename).withOptimisticUpdate(
    (localStore, args) => {
      const now = Date.now();

      // Update single project
      const existingProject = localStore.getQuery(
        api.projects.getById,
        { id: projectId }
      );

      if (existingProject) {
        localStore.setQuery(
          api.projects.getById,
          { id: projectId },
          { ...existingProject, name: args.name, updatedAt: now }
        );
      }

      // Update project list
      const existingProjects = localStore.getQuery(api.projects.get);

      if (existingProjects) {
        localStore.setQuery(
          api.projects.get,
          {},
          existingProjects.map((project) =>
            project._id === projectId
              ? { ...project, name: args.name, updatedAt: now }
              : project
          )
        );
      }
    }
  );
};
