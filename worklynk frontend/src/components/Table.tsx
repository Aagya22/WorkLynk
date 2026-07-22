import React from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Array<Column<T>>;
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  pagination,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto scrollbar-none rounded-2xl border border-[rgba(28,25,23,0.08)] bg-white">
        <table className="min-w-full text-left text-sm relative border-collapse">
          <thead className="sticky top-0 z-10 border-b border-[rgba(28,25,23,0.08)] bg-[#FBFAF8]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#8A8580] ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(28,25,23,0.06)] bg-transparent">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[#8A8580]">
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading data records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[#8A8580] font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr key={rowIdx} className="transition-colors duration-150 hover:bg-[#FBFAF8]">
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-6 py-3.5 text-[#1C1917] font-medium text-[13.5px] whitespace-nowrap align-middle ${col.className || ''}`}
                    >
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination component */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="text-xs text-[#8A8580]">
            Page <span className="font-semibold text-[#1C1917]">{pagination.page}</span> of{' '}
            <span className="font-semibold text-[#1C1917]">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[rgba(28,25,23,0.12)] text-[#57534E] hover:bg-[#F7F6F3] hover:text-[#1C1917] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[rgba(28,25,23,0.12)] text-[#57534E] hover:bg-[#F7F6F3] hover:text-[#1C1917] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
