import React from "react";

interface TemplateColumn {
  uuid: string;
  name: string;
  position: number;
  is_phone_column?: boolean;
}

interface SmsTemplate {
  uuid: string;
  name: string;
  columns: TemplateColumn[];
}

// ✅ Enhanced Excel-like preview for dynamic data
const TemplatePreview: React.FC<{ template: SmsTemplate }> = ({ template }) => {
  const sortedColumns = [...template.columns].sort((a, b) => a.position - b.position);
  const totalCols = sortedColumns.length + 4; // extra columns for preview
  const totalRows = 3; // show first 3 rows

  return (
    <div className="overflow-x-auto border rounded-md shadow-sm inline-block bg-white">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="border px-1 py-1 w-6 bg-gray-200"></th>
            {[...Array(totalCols)].map((_, idx) => (
              <th
                key={idx}
                className="border px-2 py-1 text-center font-semibold bg-gray-100 w-14 text-gray-700"
              >
                {String.fromCharCode(65 + idx)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(totalRows)].map((_, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-50">
              <td className="border px-1 py-1 bg-gray-100 text-center font-semibold text-gray-700 w-6">
                {rowIdx + 1}
              </td>
              {[...Array(totalCols)].map((_, colIdx) => {
                const col = sortedColumns[colIdx];
                let content = '';
                if (rowIdx === 0 && col) content = col.name;
                return (
                  <td
                    key={colIdx}
                    className={`border px-2 py-1 text-center truncate max-w-[100px] text-gray-800 font-normal ${
                      col?.is_phone_column ? 'bg-green-100 font-medium' : ''
                    }`}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TemplatePreview;
