import { motion } from "framer-motion";

interface ArticleCardProps {
  title: string;
  image: string;
  onClick?: () => void;
  testId?: string;
}

export default function ArticleCard({ title, image, onClick, testId }: ArticleCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 1.05 }}
      className="flex-shrink-0 w-44 cursor-pointer"
      onClick={onClick}
      data-testid={testId}
    >
      <div className="relative h-56 rounded-xl overflow-hidden shadow-md hover-elevate">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-white leading-tight">
            {title}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}
