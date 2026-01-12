import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useMutation, } from "convex/react";
import { useQuery } from "convex/react";

export const useCreateFile = () => {

  return useMutation(api.files.createFile);
}

export const useCreateFolder = () => {
  return useMutation(api.files.createFolder)
}

export const useFolderContents = ({
  projectId,
  parentId,
  enabled = true
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enabled?: boolean;
}) => {

  return useQuery(
    api.files.getFolderContents,
    enabled ? { projectId, parentId } : "skip",
  );
}
