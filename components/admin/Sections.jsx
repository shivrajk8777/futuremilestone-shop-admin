import Link from "next/link";

const KIND_CLASSES = {
  primary: "rounded-full px-[18px] py-3 border border-transparent bg-fjord-accent text-fjord-bg font-semibold text-center transition hover:bg-opacity-90 active:scale-[0.98] cursor-pointer inline-block text-[14px]",
  secondary: "rounded-full px-[18px] py-3 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold text-center transition hover:bg-fjord-accent hover:text-fjord-bg active:scale-[0.98] cursor-pointer inline-block text-[14px]",
  pill: "rounded-full px-[18px] py-3 border border-transparent bg-fjord-accent-soft text-fjord-ink font-semibold text-[13px] text-center inline-block"
};

function HeaderAction({ action }) {
  const content = action.label;
  const className = KIND_CLASSES[action.kind] || KIND_CLASSES.pill;

  if (action.href) {
    return (
      <Link className={className} href={action.href}>
        {content}
      </Link>
    );
  }

  return <button className={className}>{content}</button>;
}

export function PageHeader({ eyebrow, title, description, actions = [] }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-[18px] sm:px-[22px] sm:py-[18px] bg-fjord-panel-strong border border-fjord-soft-line rounded-[32px] shadow-fjord-soft">
      <div>
        <span className="block text-fjord-muted text-[12px] tracking-[0.14em] uppercase">{eyebrow}</span>
        <h1 className="mt-1 mb-0 text-[28px] sm:text-[32px] lg:text-[42px] font-bold tracking-[-0.06em] leading-[0.95]">{title}</h1>
        <p className="mt-1.5 mb-0 text-fjord-muted max-w-[56ch] leading-[1.6] text-[14px]">{description}</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        {actions.map((action) => (
          <HeaderAction key={action.label} action={action} />
        ))}
      </div>
    </header>
  );
}

export function PageSection({ title, description, action, children }) {
  return (
    <section className="p-[18px] sm:p-[22px] bg-fjord-panel/70 border border-fjord-soft-line backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
      {(title || description || action) && (
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            {title ? <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">{title}</h2> : null}
            {description ? <p className="mt-1 mb-0 text-fjord-muted text-[14px]">{description}</p> : null}
          </div>
          {action ? <span className="rounded-full px-[18px] py-3 border border-transparent bg-fjord-accent-soft text-fjord-ink font-semibold text-[13px] text-center inline-block">{action}</span> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <article className="p-[18px] bg-fjord-panel-strong border border-fjord-soft-line rounded-[32px] shadow-fjord-soft" key={item.label}>
          <p className="text-fjord-muted text-[14px] m-0">{item.label}</p>
          <strong className="block mt-3 text-[30px] font-bold tracking-[-0.06em]">{item.value}</strong>
          <p className="text-fjord-muted text-[12px] m-0 mt-1">{item.meta}</p>
        </article>
      ))}
    </div>
  );
}

export function SimpleList({ items }) {
  if (!items.length) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[32px] shadow-fjord-soft overflow-hidden">
        <div className="p-6 sm:p-8 bg-fjord-ink/3 border border-dashed border-fjord-ink/12 rounded-[22px] text-center m-4">
          <h3 className="m-0 text-[20px] font-semibold tracking-[-0.04em]">No records yet</h3>
          <p className="mt-2.5 mb-0 text-fjord-muted leading-[1.6] text-[14px]">Content will appear here once data is created in this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[32px] shadow-fjord-soft overflow-hidden">
      {items.map((item) => (
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_auto_auto] gap-3.5 items-center p-[18px] sm:px-5 border-t border-fjord-soft-line first:border-t-0" key={item.title}>
          <div>
            <div className="font-semibold text-[15px]">{item.title}</div>
            <div className="text-fjord-muted text-[13px]">{item.meta}</div>
          </div>
          <div className="text-[14px]">{item.value}</div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-fjord-ink/6 ${
            item.tone === "success"
              ? "text-fjord-success bg-fjord-success/12"
              : item.tone === "pending"
                ? "text-[#9b6b2b] bg-[#9b6b2b]/12"
                : "text-fjord-ink"
          }`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            {item.status}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DarkInsightCard({
  eyebrow,
  title,
  description,
  metrics,
  bars,
}) {
  return (
    <aside className="relative p-[22px] bg-gradient-to-b from-white/4 to-transparent bg-fjord-accent text-white rounded-[32px] shadow-fjord-soft overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute bottom-[-80px] right-[-60px] w-[220px] h-[220px] rounded-full bg-fjord-warm/14 blur-[8px] pointer-events-none" />
      
      <span className="block text-white/50 text-[12px] tracking-[0.14em] uppercase">{eyebrow}</span>
      <h2 className="text-[24px] font-bold tracking-[-0.05em] m-0 mt-1">{title}</h2>
      <p className="text-white/72 text-[14px] leading-[1.6] m-0 mt-2">{description}</p>
      
      <div className="grid grid-cols-7 items-end gap-2.5 mt-[22px] h-[180px] relative z-1" aria-hidden="true">
        {bars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="block rounded-t-full rounded-b-[16px] bg-gradient-to-b from-fjord-warm to-fjord-warm/20"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 relative z-1">
        {metrics.map((metric) => (
          <div className="p-3.5 rounded-[18px] bg-white/8" key={metric.label}>
            <span className="text-white/60 text-[13px]">{metric.label}</span>
            <strong className="block mt-2 text-[22px] font-bold">{metric.value}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function SimpleTable({ columns, rows }) {
  if (!rows.length) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[32px] shadow-fjord-soft overflow-hidden">
        <div
          className="grid gap-3.5 items-center px-5 py-4 bg-fjord-ink/4 text-fjord-muted text-[13px] font-semibold tracking-wider uppercase max-sm:!grid-cols-1"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="p-6 sm:p-8 bg-fjord-ink/3 border border-dashed border-fjord-ink/12 rounded-[22px] text-center m-4">
          <h3 className="m-0 text-[20px] font-semibold tracking-[-0.04em]">No entries yet</h3>
          <p className="mt-2.5 mb-0 text-fjord-muted leading-[1.6] text-[14px]">Records will appear here after the first items are created.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[32px] shadow-fjord-soft overflow-hidden">
      <div
        className="grid gap-3.5 items-center px-5 py-4 bg-fjord-ink/4 text-fjord-muted text-[13px] font-semibold tracking-wider uppercase max-sm:!grid-cols-1"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      {rows.map((row) => (
        <div
          className="grid gap-3.5 items-center px-5 py-4 border-t border-fjord-soft-line first:border-t-0 max-sm:!grid-cols-1"
          key={row[0]}
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, index) => (
            <div className={index === 0 ? "block text-[15px]" : "text-[14px]"} key={`${row[0]}-${index}`}>
              {index === 0 ? <strong className="font-bold">{cell}</strong> : cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
