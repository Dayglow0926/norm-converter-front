'use client';

import type { ChecklistItem } from '../model/languageAnalysisStore';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
    </div>
  );
}

export function ChecklistRow({
  item,
  onChange,
  showNegative = true,
}: {
  item: ChecklistItem;
  onChange: (value: 'positive' | 'negative' | null) => void;
  showNegative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b py-1.5 last:border-0">
      <span className="text-sm">{item.label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange(item.value === 'positive' ? null : 'positive')}
          className={[
            'rounded px-2 py-0.5 text-xs font-medium transition-colors',
            item.value === 'positive'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-muted hover:bg-muted/80',
          ].join(' ')}
        >
          예
        </button>
        {showNegative && (
          <button
            type="button"
            onClick={() => onChange(item.value === 'negative' ? null : 'negative')}
            className={[
              'rounded px-2 py-0.5 text-xs font-medium transition-colors',
              item.value === 'negative'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-muted hover:bg-muted/80',
            ].join(' ')}
          >
            아니오
          </button>
        )}
      </div>
    </div>
  );
}
