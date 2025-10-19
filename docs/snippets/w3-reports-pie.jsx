import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function ExpensesPie({ data }) {
  // data: [{ name: "Food", value: 123.45 }, ...]
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie dataKey="value" data={data} label />
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
