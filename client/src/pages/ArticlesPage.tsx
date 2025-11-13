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
        title: "How Gut Health Influences the Brain",
        image: "/articles/GutHealth8.jpeg",
      },
      {
        id: 2,
        title: "When the Mind Creates Pain",
        image: "/articles/Psychosomatic1.jpeg",
      },
      {
        id: 3,
        title: "Superfoods for Brain Health, Energy & Longevity",
        image: healthImage,
      },
    ],
  },
  {
    name: "Brain Performance",
    articles: [
      {
        id: 4,
        title: "Rewire Your Neocortex for Faster Learning",
        image: "/articles/Neo.jpeg",
      },
      {
        id: 5,
        title: "Memory Enhancement Techniques",
        image: "/articles/BetterMemor.jpeg",
      },
      {
        id: 6,
        title: "Reset your Focus in 90sec",
        image: "/articles/Rese.jpeg",
      },
    ],
  },
  {
    name: "Relationships",
    articles: [
      {
        id: 7,
        title: "Why You Attract Emotionally Unavailable Partners",
        image: "/articles/EmotionallyUA.jpeg",
      },
      {
        id: 8,
        title: "Building Deeper Connections",
        image: "/articles/BDC.jpeg",
      },
      {
        id: 9,
        title: "Healing & Forgiveness in Relationships",
        image: "/articles/Forgiveness.jpeg",
      },
    ],
  },
  {
    name: "My Book Recommendation",
    articles: [
      {
        id: 10,
        title: "Healing the Shame that binds you ",
        image: "/articles/ShameThatBindsYou.png",
      },
      {
        id: 11,
        title: "The Body Keeps the Score",
        image: "/articles/TheBodyKeep.png",
      },
      { id: 12, title: "Atomic Habbits", image: "/articles/Atomic.png" },
    ],
  },
  {
    name: "Parenting",
    articles: [
      {
        id: 13,
        title: "What Kids Really Want from You",
        image: "/articles/Kid1.jpeg",
      },
      {
        id: 14,
        title: "Why “Connection Before Correction” Works",
        image: "/articles/CC.jpeg",
      },
      {
        id: 15,
        title: "Self-Care Isn’t Selfish: The Foundation of Calm Parenting",
        image: "/articles/CP.jpeg",
      },
    ],
  },
  {
    name: "Spirituality",
    articles: [
      {
        id: 16,
        title: "Soul Lessons: Why Challenges Are Invitations to Grow",
        image: "/articles/SL.jpeg",
      },
      {
        id: 17,
        title: "Chakras and Modern Science — Finding the Bridge",
        image: "/articles/CS.jpeg",
      },
      {
        id: 18,
        title: "The Shift from 3D to 5D Consciousness",
        image: "/articles/35D.jpeg",
      },
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
            <h1
              className="text-xl font-bold text-gray-600 absolute left-1/2 -translate-x-1/2 tracking-widest"
              style={{ fontFamily: "Montserrat" }}
            >
              ARTICLES
            </h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="relative h-52 overflow-hidden">
          <img
            src="/articles/articles-dr-m.png"
            alt="Dr. M's Guide"
            className="w-full h-full object-cover"
          />
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
