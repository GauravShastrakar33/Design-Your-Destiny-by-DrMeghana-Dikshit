import ArticleCard from '../ArticleCard';
import healthImage from '@assets/generated_images/Health_and_fitness_article_f5b72086.png';

export default function ArticleCardExample() {
  return (
    <ArticleCard
      title="10 Daily Habits for Optimal Health"
      image={healthImage}
      onClick={() => console.log('Article clicked')}
    />
  );
}
