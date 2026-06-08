"use client";

type Props = {
  customer: any;
  onClose: () => void;
};

export default function CustomerDrawer({
  customer,
  onClose,
}: Props) {
  if (!customer) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex justify-end z-50"
      onClick={onClose}
    >
      <div
        className="h-full w-[500px] bg-white shadow-2xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {customer.grantor}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-sm text-gray-500">
              Opportunity Name
            </div>

            <div className="font-medium">
              {customer.opportunity_name}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Category
            </div>

            <div>{customer.Category}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Deadline
            </div>

            <div>
              {customer.deadline || "Not set"}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Anticipated Deadline
            </div>

            <div>
              {customer.anticipated_deadline ||
                "Not set"}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Record ID
            </div>

            <div>{customer.id}</div>
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