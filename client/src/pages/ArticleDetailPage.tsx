import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import type { Article, Category } from "@shared/schema";

export default function ArticleDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/articles/:id");
  const articleId = params?.id ? parseInt(params.id) : 0;

  const {
    data: article,
    isLoading: articleLoading,
    error,
  } = useQuery<Article | null>({
    queryKey: ["/api/articles", articleId],
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) throw new Error("Failed to fetch article");
      return response.json();
    },
    enabled: articleId > 0,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const category = categories.find((c) => c.id === article?.categoryId);

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Failed to load article</p>
        <button
          onClick={() => setLocation("/articles")}
          className="text-primary hover:underline"
          data-testid="button-back-to-articles"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Article not found</p>
        <button
          onClick={() => setLocation("/articles")}
          className="text-primary hover:underline"
          data-testid="button-back-to-articles"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <Header
          title="Article"
          hasBackButton={true}
          onBack={() => setLocation("/articles")}
        />

        <div className="relative h-64 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="px-4 py-6 space-y-4">
          {category && (
            <Badge
              variant="secondary"
              className="text-sm"
              data-testid="badge-category"
            >
              {category.name}
            </Badge>
          )}

          <h2
            className="text-2xl font-bold text-foreground leading-tight"
            style={{ fontFamily: "Montserrat" }}
            data-testid="text-article-title"
          >
            {article.title}
          </h2>

          <p
            className="text-sm text-muted-foreground"
            data-testid="text-article-date"
          >
            {new Date(article.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div
            className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: article.content }}
            data-testid="content-article-body"
          />
        </div>
      </div>
    </div>
  );
}
