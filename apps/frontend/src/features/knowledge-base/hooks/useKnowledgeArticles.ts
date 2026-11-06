import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getKnowledgeArticles,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
} from "../api/knowledgeBase.service";
import type {
  CreateKnowledgeArticleInput,
  UpdateKnowledgeArticleInput,
} from "../types/knowledgeBase.types";

const knowledgeArticlesKey = ["knowledge-articles"];

export const useKnowledgeArticles = () => {
  return useQuery({
    queryKey: knowledgeArticlesKey,
    queryFn: getKnowledgeArticles,
  });
};

export const useCreateKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateKnowledgeArticleInput) =>
      createKnowledgeArticle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeArticlesKey });
    },
  });
};

export const useUpdateKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateKnowledgeArticleInput) =>
      updateKnowledgeArticle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeArticlesKey });
    },
  });
};

export const useDeleteKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteKnowledgeArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeArticlesKey });
    },
  });
};