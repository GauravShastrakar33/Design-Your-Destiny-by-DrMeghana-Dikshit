interface AdminHeaderProps {
  title: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-6">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
    </div>
  );
}
