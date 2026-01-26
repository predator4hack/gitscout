import { Icon } from '../../shared/Icon';
import type { TableColumn } from '../../../types/dashboard';

interface TableHeaderProps {
  columns: TableColumn[];
}

export function TableHeader({ columns }: TableHeaderProps) {
  return (
    <thead className="sticky top-0 z-10 bg-gs-body/95 backdrop-blur-sm border-b border-white/[0.06] text-[10px] uppercase font-mono tracking-wider text-gs-text-muted font-medium">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={`py-3 px-4 font-normal ${
              column.align === 'center' ? 'text-center' : ''
            } ${column.align === 'right' ? 'text-right pr-6' : ''}`}
            style={{ width: column.width }}
          >
            {column.key === 'star' ? (
              <Icon icon="lucide:star" className="w-3.5 h-3.5 mx-auto" />
            ) : (
              column.label
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}
