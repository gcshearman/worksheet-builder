import { useState } from "react";
import type { Worksheet, WorksheetSection } from "./builder.types";

export default function BuilderPage() {
  const [worksheet, setWorksheet] = useState<Worksheet>({
    title: "",
    module: "",
    sections: [],
  });

  const addSection = () => {
    const newSection: WorksheetSection = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
    };

    setWorksheet((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const updateSection = (
    id: string,
    field: keyof WorksheetSection,
    value: string
  ) => {
    setWorksheet((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === id
          ? { ...section, [field]: value }
          : section
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h1 className="mb-6 text-3xl font-bold">
            Scientific Worksheet Builder
          </h1>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                Worksheet Title
              </label>

              <input
                type="text"
                value={worksheet.title}
                onChange={(e) =>
                  setWorksheet({
                    ...worksheet,
                    title: e.target.value,
                  })
                }
                className="w-full rounded border p-2"
                placeholder="e.g. Measuring the Radius of Sodium Ions"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Module
              </label>

              <input
                type="text"
                value={worksheet.module}
                onChange={(e) =>
                  setWorksheet({
                    ...worksheet,
                    module: e.target.value,
                  })
                }
                className="w-full rounded border p-2"
                placeholder="e.g. CH4011 Practical"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mb-6">
          <h2 className="mb-4 text-2xl font-semibold">
            Sections
          </h2>

          {worksheet.sections.map((section, index) => (
            <div
              key={section.id}
              className="mb-4 rounded-xl bg-white p-6 shadow"
            >
              <h3 className="mb-4 text-lg font-semibold">
                Section {index + 1}
              </h3>

              <div className="mb-4">
                <label className="mb-2 block font-medium">
                  Section Title
                </label>

                <input
                  type="text"
                  value={section.title}
                  onChange={(e) =>
                    updateSection(
                      section.id,
                      "title",
                      e.target.value
                    )
                  }
                  className="w-full rounded border p-2"
                  placeholder="Section title"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Description
                </label>

                <textarea
                  value={section.description}
                  onChange={(e) =>
                    updateSection(
                      section.id,
                      "description",
                      e.target.value
                    )
                  }
                  className="min-h-[120px] w-full rounded border p-2"
                  placeholder="Describe this section..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={addSection}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            + Add Section
          </button>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Worksheet JSON Preview
          </h2>

          <pre className="overflow-auto rounded bg-slate-900 p-4 text-sm text-green-300">
            {JSON.stringify(worksheet, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}