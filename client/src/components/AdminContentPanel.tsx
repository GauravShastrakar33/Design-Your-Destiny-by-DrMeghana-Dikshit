interface AdminContentPanelProps {
  children: React.ReactNode;
}

export default function AdminContentPanel({ children }: AdminContentPanelProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      {children}
    </div>
  );
}
