export const getPositionLabel = (position: string) => {
  const labels: Record<string, string> = {
    chairman: "Chủ tịch",
    secretary: "Thư ký",
    reviewer: "Phản biện",
    member: "Ủy viên",
  };
  return labels[position] || position;
};

export const getPositionColor = (position: string) => {
  const colors: Record<string, string> = {
    chairman: "bg-red-50 text-red-700 border-red-200",
    secretary: "bg-blue-50 text-blue-700 border-blue-200",
    reviewer: "bg-purple-50 text-purple-700 border-purple-200",
    member: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return colors[position] || "bg-gray-50 text-gray-700 border-gray-200";
};
