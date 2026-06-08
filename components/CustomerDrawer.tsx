"use client";

type Customer = {
  id: number;
  Name: string;
  Category: string;
  created_at: string;
};

type Props = {
  customer: Customer | null;
  onClose: () => void;
};

export default function CustomerDrawer({
  customer,
  onClose,
}: Props) {
  if (!customer) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex justify-end"
      onClick={onClose}
    >
      <div
        className="h-full w-[450px] bg-white shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {customer.Name}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">
              ID
            </div>
            <div>{customer.id}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Category
            </div>
            <div>{customer.Category}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Created
            </div>
            <div>
              {new Date(
                customer.created_at
              ).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}