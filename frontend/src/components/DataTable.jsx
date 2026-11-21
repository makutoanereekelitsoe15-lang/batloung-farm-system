// components/DataTable.jsx
// Generic table component for consistent list views
export default function DataTable({ columns, rows, emptyText = 'No records found.', loading }) {
  if (loading) return <p className="muted">Loading...</p>;
  if (!rows || rows.length === 0) return <p className="muted">{emptyText}</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.key || index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
