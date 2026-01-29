import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ArticleCard from "@/components/ArticleCard";
import type { Article, Category } from "@shared/schema";

interface ArticleWithCategory extends Article {
  category?: Category;
}

export default function ArticlesPage() {
  const [, setLocation] = useLocation();

  const { data: articles = [], isLoading: articlesLoading } = useQuery<
    Article[]
  >({
    queryKey: ["/api/articles"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["/api/categories"],
  });

  const isLoading = articlesLoading || categoriesLoading;

  const groupedArticles = categories.reduce((acc, category) => {
    const categoryArticles = articles.filter(
      (article) => article.categoryId === category.id
    );
    if (categoryArticles.length > 0) {
      acc.push({
        category,
        articles: categoryArticles,
      });
    }
    return acc;
  }, [] as { category: Category; articles: Article[] }[]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <Header
          title="Articles"
          hasBackButton={true}
          onBack={() => setLocation("/")}
        />

        <div className="relative h-52 overflow-hidden">
          <img
            src="/articles/articles-dr-m.png"
            alt="Dr. M's Guide"
            className="w-full h-full object-cover"
          />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading articles...
          </div>
        ) : groupedArticles.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No articles available yet.
          </div>
        ) : (
          <div className="py-6 space-y-8">
            {groupedArticles.map(({ category, articles: categoryArticles }) => (
              <div
                key={category.id}
                data-testid={`category-${category.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <h3 className="text-xl font-semibold text-foreground px-4 mb-4">
                  {category.name}
                </h3>
                <div className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
                  {categoryArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      title={article.title}
                      image={article.imageUrl}
                      onClick={() => setLocation(`/articles/${article.id}`)}
                      testId={`article-${article.id}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
