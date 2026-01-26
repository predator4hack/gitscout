interface QueryTitleProps {
  title: string;
}

export function QueryTitle({ title }: QueryTitleProps) {
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      <h1 className="text-gs-text-main font-mono text-sm underline decoration-dashed decoration-gs-text-dim underline-offset-4 hover:text-white transition-colors truncate">
        {title}
      </h1>
    </div>
  );
}
