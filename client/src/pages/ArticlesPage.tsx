import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import ArticleCard from "@/components/ArticleCard";
import bannerImage from "@assets/generated_images/Wellness_meditation_banner_image_be024d9a.png";
import healthImage from "@assets/generated_images/Health_and_fitness_article_f5b72086.png";
import brainImage from "@assets/generated_images/Brain_performance_article_image_36ff524a.png";
import relationshipImage from "@assets/generated_images/Relationships_article_image_affe7350.png";
import bookImage from "@assets/generated_images/Book_recommendations_article_image_126e5d24.png";
import parentingImage from "@assets/generated_images/Parenting_article_image_bce0f0ef.png";
import spiritualityImage from "@assets/generated_images/Spirituality_article_image_2ec5c92f.png";

const categories = [
  {
    name: "Health",
    articles: [
      {
        id: 1,
        title: "10 Daily Habits for Optimal Health",
        image: healthImage,
      },
      {
        id: 2,
        title: "Nutrition Basics: Eating for Energy",
        image: healthImage,
      },
      { id: 3, title: "Movement & Exercise Guide", image: healthImage },
    ],
  },
  {
    name: "Brain Performance",
    articles: [
      { id: 4, title: "Boost Your Focus & Concentration", image: brainImage },
      { id: 5, title: "Memory Enhancement Techniques", image: brainImage },
      { id: 6, title: "Mental Clarity Through Meditation", image: brainImage },
    ],
  },
  {
    name: "Relationships",
    articles: [
      { id: 7, title: "Building Deeper Connections", image: relationshipImage },
      {
        id: 8,
        title: "Communication for Better Relationships",
        image: relationshipImage,
      },
      {
        id: 9,
        title: "Healing & Forgiveness in Relationships",
        image: relationshipImage,
      },
    ],
  },
  {
    name: "My Book Recommendation",
    articles: [
      { id: 10, title: "The Power of Now by Eckhart Tolle", image: bookImage },
      { id: 11, title: "Atomic Habits by James Clear", image: bookImage },
      { id: 12, title: "The Body Keeps the Score", image: bookImage },
    ],
  },
  {
    name: "Parenting",
    articles: [
      {
        id: 13,
        title: "Conscious Parenting Principles",
        image: parentingImage,
      },
      {
        id: 14,
        title: "Supporting Your Child's Emotional Growth",
        image: parentingImage,
      },
      {
        id: 15,
        title: "Mindful Connection with Your Children",
        image: parentingImage,
      },
    ],
  },
  {
    name: "Spirituality",
    articles: [
      { id: 16, title: "Daily Spiritual Practices", image: spiritualityImage },
      { id: 17, title: "Finding Your Inner Peace", image: spiritualityImage },
      { id: 18, title: "Awakening Your Higher Self", image: spiritualityImage },
    ],
  },
];

export default function ArticlesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-gray-600 absolute left-1/2 -translate-x-1/2 tracking-widest" style={{ fontFamily: "Montserrat" }}>
              ARTICLES
            </h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="relative h-64 overflow-hidden">
          <img
            src={bannerImage}
            alt="Dr. M's Guide"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-2 font-serif">
              Dr. M's Guide
            </h2>
            <p className="text-lg text-white/90 italic">
              "Wisdom for your wellness journey"
            </p>
          </div>
        </div>

        <div className="py-6 space-y-8">
          {categories.map((category) => (
            <div
              key={category.name}
              data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <h3 className="text-xl font-semibold text-foreground px-4 mb-4">
                {category.name}
              </h3>
              <div className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
                {category.articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    title={article.title}
                    image={article.image}
                    onClick={() =>
                      console.log(`Clicked article: ${article.title}`)
                    }
                    testId={`article-${article.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
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
