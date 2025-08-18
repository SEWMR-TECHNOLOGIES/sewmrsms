import React from "react";

// Define the type inline here instead of importing from '@/types'
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

// ✅ New reusable preview component styled like Excel
const TemplatePreview: React.FC<{ template: SmsTemplate }> = ({ template }) => {
  const sortedColumns = [...template.columns].sort((a, b) => a.position - b.position);

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <table className="border-collapse min-w-full">
        <thead>
          <tr>
            {sortedColumns.map((col, idx) => (
              <th
                key={col.uuid}
                className={`border px-3 py-2 text-center text-sm font-semibold bg-gray-50 ${
                  col.is_phone_column ? "bg-green-100" : ""
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {sortedColumns.map((col) => (
                <td
                  key={col.uuid + rowIndex}
                  className={`border text-center text-sm text-gray-500 ${
                    col.is_phone_column ? "bg-green-50" : ""
                  } ${col.is_phone_column ? "py-2" : "py-6"}`}
                >
                  {rowIndex + 1}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TemplatePreview;
