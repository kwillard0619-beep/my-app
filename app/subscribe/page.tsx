"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  name: string;
};

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories from Supabase
  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error loading categories:", error);
        return;
      }

      setCategories(data ?? []);
    }

    loadCategories();
  }, []);

  const toggleCategory = (category: string) => {
    // Remove category if already selected
    if (selected.includes(category)) {
      setSelected(selected.filter((c) => c !== category));
      return;
    }

    // Limit to 5 selections
    if (selected.length >= 5) {
      alert("You may select up to 5 categories.");
      return;
    }

    setSelected([...selected, category]);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const { error } = await supabase
      .from("subscribers")
      .insert({
        email,
        categories: selected,
      });

    if (error) {
      console.error(error);
      alert("There was a problem subscribing.");
      return;
    }

    setSuccess(true);
    setEmail("");
    setSelected([]);
  };

  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-2">
        Subscribe to Weekly Opportunities
      </h1>

      <p className="text-gray-600 mb-8">
        Receive a weekly email with new opportunities
        matching your selected interests.
      </p>

      {success && (
        <div className="mb-6 rounded-lg bg-green-100 border border-green-300 p-4 text-green-800">
          ✅ Subscription successful!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <div>
          <label className="block mb-2 font-medium">
            Email Address
          </label>

          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-4">
            Choose up to 5 categories
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 rounded-lg border p-3 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(
                    category.name
                  )}
                  onChange={() =>
                    toggleCategory(category.name)
                  }
                />

                <span>{category.name}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            {selected.length} of 5 selected
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 transition"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}