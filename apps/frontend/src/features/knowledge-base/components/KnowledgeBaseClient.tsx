"use client";

import { useState } from "react";

import { useIsAdmin } from "@/features/auth/hooks/useIsAdmin";
import { useKnowledgeCategories } from "../hooks/useKnowledgeCategories";

import type { KnowledgeArticleWithCategory } from "../types/knowledgeBase.types";

import KnowledgeArticlesList from "./KnowledgeArticlesList";
import KnowledgeArticleDetailsModal from "./KnowledgeArticleDetailsModal";
import AddKnowledgeArticleModal from "./AddKnowledgeArticleModal";
import EditKnowledgeArticleModal from "./EditKnowledgeArticleModal";
import DeleteKnowledgeArticleModal from "./DeleteKnowledgeArticleModal";

export default function KnowledgeBaseClient() {
  const { data: isAdmin = false, isLoading: isAdminLoading } = useIsAdmin();

  const { data: categories = [] } = useKnowledgeCategories();

  const [isAddOpen, setIsAddOpen] = useState(false);

  const [selectedArticle, setSelectedArticle] =
    useState<KnowledgeArticleWithCategory | null>(null);

  const [viewArticle, setViewArticle] =
    useState<KnowledgeArticleWithCategory | null>(null);

  const [editArticle, setEditArticle] =
    useState<KnowledgeArticleWithCategory | null>(null);

  const [deleteArticle, setDeleteArticle] =
    useState<KnowledgeArticleWithCategory | null>(null);

  if (isAdminLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-gray-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Knowledge Base
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            Explore medical articles, clinical guidelines and healthcare
            resources.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
          >
            <span className="text-lg">+</span>
            Add Article
          </button>
        )}
      </div>

      {/* Articles */}
      <KnowledgeArticlesList
        isAdmin={isAdmin}
        onView={setViewArticle}
        onEdit={setEditArticle}
        onDelete={setDeleteArticle}
      />

      {/* Add Article */}
      {isAdmin && (
        <AddKnowledgeArticleModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          categories={categories}
        />
      )}

      {/* Article Details */}
      <KnowledgeArticleDetailsModal
        isOpen={Boolean(viewArticle)}
        article={viewArticle}
        onClose={() => setViewArticle(null)}
      />

      {/* Edit Article */}
      {isAdmin && (
        <EditKnowledgeArticleModal
          isOpen={Boolean(editArticle)}
          article={editArticle}
          categories={categories}
          onClose={() => setEditArticle(null)}
        />
      )}

      {/* Delete Article */}
      {isAdmin && (
        <DeleteKnowledgeArticleModal
          isOpen={Boolean(deleteArticle)}
          article={deleteArticle}
          onClose={() => setDeleteArticle(null)}
        />
      )}
    </div>
  );
}
