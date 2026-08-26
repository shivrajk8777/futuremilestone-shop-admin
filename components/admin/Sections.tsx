import Link from "next/link";
import { ReactNode } from "react";

const KIND_CLASSES: Record<string, string> = {
  primary: "rounded-full px-[18px] py-3 border border-transparent bg-futuremilestone-accent text-futuremilestone-bg font-semibold text-center transition hover:bg-opacity-90 active:scale-[0.98] cursor-pointer inline-block text-[14px]",
  secondary: "rounded-full px-[18px] py-3 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold text-center transition hover:bg-futuremilestone-accent hover:text-futuremilestone-bg active:scale-[0.98] cursor-pointer inline-block text-[14px]",
  pill: "rounded-full px-[18px] py-3 border border-transparent bg-futuremilestone-accent-soft text-futuremilestone-ink font-semibold text-[13px] text-center inline-block"
};

export interface HeaderActionProps {
  label: string;
  kind?: "primary" | "secondary" | "pill";
  href?: string;
}

function HeaderAction({ action }: { action: HeaderActionProps }) {
  const content = action.label;
  const className = KIND_CLASSES[action.kind || ""] || KIND_CLASSES.pill;

  if (action.href) {
    return (
      <Link className={className} href={action.href}>
        {content}
      </Link>
    );
  }

  return <button className={className}>{content}</button>;
}

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: HeaderActionProps[];
}

export function PageHeader({ eyebrow, title, description, actions = [] }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-[18px] sm:px-[22px] sm:py-[18px] bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[32px] shadow-futuremilestone-soft">
      <div>
        <span className="block text-futuremilestone-muted text-[12px] tracking-[0.14em] uppercase">{eyebrow}</span>
        <h1 className="mt-1 mb-0 text-[28px] sm:text-[32px] lg:text-[42px] font-bold tracking-[-0.06em] leading-[0.95]">{title}</h1>
        <p className="mt-1.5 mb-0 text-futuremilestone-muted max-w-[56ch] leading-[1.6] text-[14px]">{description}</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        {actions.map((action) => (
          <HeaderAction key={action.label} action={action} />
        ))}
      </div>
    </header>
  );
}

export interface PageSectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function PageSection({ title, description, action, children }: PageSectionProps) {
  return (
    <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/70 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
      {(title || description || action) && (
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            {title ? <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">{title}</h2> : null}
            {description ? <p className="mt-1 mb-0 text-futuremilestone-muted text-[14px]">{description}</p> : null}
          </div>
          {action ? <span className="rounded-full px-[18px] py-3 border border-transparent bg-futuremilestone-accent-soft text-futuremilestone-ink font-semibold text-[13px] text-center inline-block">{action}</span> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export interface StatItem {
  label: string;
  value: ReactNode;
  meta: string;
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <article className="p-[18px] bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[32px] shadow-futuremilestone-soft" key={item.label}>
          <p className="text-futuremilestone-muted text-[14px] m-0">{item.label}</p>
          <strong className="block mt-3 text-[30px] font-bold tracking-[-0.06em]">{item.value}</strong>
          <p className="text-futuremilestone-muted text-[12px] m-0 mt-1">{item.meta}</p>
        </article>
      ))}
    </div>
  );
}

export interface SimpleListItem {
  title: string;
  meta: string;
  value: ReactNode;
  tone?: "success" | "pending" | "normal";
  status: string;
}

export function SimpleList({ items }: { items: SimpleListItem[] }) {
  if (!items.length) {
    return (
      <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[32px] shadow-futuremilestone-soft overflow-hidden">
        <div className="p-6 sm:p-8 bg-futuremilestone-ink/3 border border-dashed border-futuremilestone-ink/12 rounded-[22px] text-center m-4">
          <h3 className="m-0 text-[20px] font-semibold tracking-[-0.04em]">No records yet</h3>
          <p className="mt-2.5 mb-0 text-futuremilestone-muted leading-[1.6] text-[14px]">Content will appear here once data is created in this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[32px] shadow-futuremilestone-soft overflow-hidden">
      {items.map((item) => (
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_auto_auto] gap-3.5 items-center p-[18px] sm:px-5 border-t border-futuremilestone-soft-line first:border-t-0" key={item.title}>
          <div>
            <div className="font-semibold text-[15px]">{item.title}</div>
            <div className="text-futuremilestone-muted text-[13px]">{item.meta}</div>
          </div>
          <div className="text-[14px]">{item.value}</div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-futuremilestone-ink/6 ${
            item.tone === "success"
              ? "text-futuremilestone-success bg-futuremilestone-success/12"
              : item.tone === "pending"
                ? "text-[#9b6b2b] bg-[#9b6b2b]/12"
                : "text-futuremilestone-ink"
          }`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            {item.status}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface MetricItem {
  label: string;
  value: ReactNode;
}

export interface DarkInsightCardProps {
  eyebrow: string;
  title: string;
  description: string;
  metrics: MetricItem[];
  bars: number[];
}

export function DarkInsightCard({
  eyebrow,
  title,
  description,
  metrics,
  bars,
}: DarkInsightCardProps) {
  return (
    <aside className="relative p-[22px] bg-gradient-to-b from-white/4 to-transparent bg-futuremilestone-accent text-white rounded-[32px] shadow-futuremilestone-soft overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute bottom-[-80px] right-[-60px] w-[220px] h-[220px] rounded-full bg-futuremilestone-warm/14 blur-[8px] pointer-events-none" />
      
      <span className="block text-white/50 text-[12px] tracking-[0.14em] uppercase">{eyebrow}</span>
      <h2 className="text-[24px] font-bold tracking-[-0.05em] m-0 mt-1">{title}</h2>
      <p className="text-white/72 text-[14px] leading-[1.6] m-0 mt-2">{description}</p>
      
      <div className="grid grid-cols-7 items-end gap-2.5 mt-[22px] h-[180px] relative z-1" aria-hidden="true">
        {bars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="block rounded-t-full rounded-b-[16px] bg-gradient-to-b from-futuremilestone-warm to-futuremilestone-warm/20"
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

export interface SimpleTableProps {
  columns: string[];
  rows: ReactNode[][];
}

export function SimpleTable({ columns, rows }: SimpleTableProps) {
  if (!rows.length) {
    return (
      <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[32px] shadow-futuremilestone-soft overflow-hidden">
        <div
          className="grid gap-3.5 items-center px-5 py-4 bg-futuremilestone-ink/4 text-futuremilestone-muted text-[13px] font-semibold tracking-wider uppercase max-sm:!grid-cols-1"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="p-6 sm:p-8 bg-futuremilestone-ink/3 border border-dashed border-futuremilestone-ink/12 rounded-[22px] text-center m-4">
          <h3 className="m-0 text-[20px] font-semibold tracking-[-0.04em]">No entries yet</h3>
          <p className="mt-2.5 mb-0 text-futuremilestone-muted leading-[1.6] text-[14px]">Records will appear here after the first items are created.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[32px] shadow-futuremilestone-soft overflow-hidden">
      <div
        className="grid gap-3.5 items-center px-5 py-4 bg-futuremilestone-ink/4 text-futuremilestone-muted text-[13px] font-semibold tracking-wider uppercase max-sm:!grid-cols-1"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div
          className="grid gap-3.5 items-center px-5 py-4 border-t border-futuremilestone-soft-line first:border-t-0 max-sm:!grid-cols-1"
          key={rowIndex}
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, index) => (
            <div className={index === 0 ? "block text-[15px]" : "text-[14px]"} key={index}>
              {index === 0 ? <strong className="font-bold">{cell}</strong> : cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
