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

// ✅ Modal-friendly Excel-like preview
const TemplatePreview: React.FC<{ template: SmsTemplate }> = ({ template }) => {
  const sortedColumns = [...template.columns].sort((a, b) => a.position - b.position);
  const totalCols = sortedColumns.length + 4; // extra columns for preview
  const totalRows = 3;

  return (
    <div className="w-full flex justify-center overflow-x-auto">
      <table className="border-collapse text-sm max-w-full">
        <thead>
          <tr>
            <th className="border px-3 py-2 w-10 bg-gray-200"></th>
            {[...Array(totalCols)].map((_, idx) => (
              <th
                key={idx}
                className="border px-4 py-2 text-center font-semibold bg-gray-100 w-20 text-gray-700"
              >
                {String.fromCharCode(65 + idx)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(totalRows)].map((_, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-50">
              <td className="border px-3 py-2 bg-gray-100 text-center font-semibold text-gray-700 w-10">
                {rowIdx + 1}
              </td>
              {[...Array(totalCols)].map((_, colIdx) => {
                const col = sortedColumns[colIdx];
                let content = "";
                if (rowIdx === 0 && col) content = col.name;
                return (
                  <td
                    key={colIdx}
                    className={`border px-4 py-2 text-center truncate max-w-[120px] text-gray-800 font-normal ${
                      col?.is_phone_column ? "bg-green-100 font-medium" : ""
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
