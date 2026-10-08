export function StatBars({ rows }: { rows: { label: string; value: number; max?: number }[] }) {
  return (
    <div>
      {rows.map((row) => {
        const max = row.max ?? Math.max(...rows.map((r) => r.value), 1);
        return (
          <div className="stat-row" key={row.label}>
            <strong>{row.label}</strong>
            <div className="bar"><span style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }} /></div>
            <span>{row.value}</span>
          </div>
        );
      })}
    </div>
  );
}
