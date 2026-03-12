interface BlogStat {
  site: string;
  url: string;
  count: number;
}

export function BlogStats({ stats }: { stats: BlogStat[] }) {
  const total = stats.reduce((s, b) => s + b.count, 0);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Blog Posts</span>
        <span className="mono" style={{ fontSize: "14px", fontWeight: 700, color: "var(--cyan)" }}>
          {total}
        </span>
      </div>

      <div className="space-y-2">
        {stats.map((blog) => (
          <a
            key={blog.site}
            href={`https://${blog.url}/blog`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-between py-2 px-3 rounded transition-colors"
            style={{
              background: "var(--surface-2)",
              textDecoration: "none",
              color: "var(--text)",
            }}
          >
            <div>
              <div className="text-sm font-medium">{blog.site}</div>
              <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                {blog.url}
              </div>
            </div>
            <div className="mono text-lg font-bold" style={{ color: "var(--cyan)" }}>
              {blog.count}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
