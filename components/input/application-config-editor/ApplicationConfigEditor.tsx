"use client";

import React, { useCallback } from "react";
import Chip from "@/components/input/chip/Chip";
import {
  JobSpecificApplicationConfiguration,
  JobApplicationFieldConfig,
} from "@/types/dbTypes";

interface ApplicationConfigEditorProps {
  value: JobSpecificApplicationConfiguration;
  onChange: (newValue: JobSpecificApplicationConfiguration) => void;
  // Add other props like disabled if needed
}

// Define the possible states for the chips
type FieldRequirementState = "Mandatory" | "Optional" | "Off";

const ApplicationConfigEditor: React.FC<ApplicationConfigEditorProps> = ({
  value,
  onChange,
}) => {
  // Function to determine the current state based on field properties
  const getFieldState = (
    field: JobApplicationFieldConfig
  ): FieldRequirementState => {
    if (field.isShown && field.validation.required) {
      return "Mandatory";
    }
    if (field.isShown && !field.validation.required) {
      return "Optional";
    }
    return "Off"; // !field.isShown (required is implicitly false if not shown)
  };

  // Handler for changing a field's state via chip clicks
  const handleStateChange = useCallback(
    (fieldKey: string, newState: FieldRequirementState) => {
      // Create a deep copy to ensure immutability
      const newValue: JobSpecificApplicationConfiguration = JSON.parse(
        JSON.stringify(value)
      );

      // Find the field and update its properties based on the new state
      for (const section of newValue.sections) {
        const field = section.fields.find((f) => f.key === fieldKey);
        if (field) {
          switch (newState) {
            case "Mandatory":
              field.isShown = true;
              field.validation.required = true;
              break;
            case "Optional":
              field.isShown = true;
              field.validation.required = false;
              break;
            case "Off":
              field.isShown = false;
              field.validation.required = false; // Cannot be required if not shown
              break;
          }
          break; // Exit loop once field is found and updated
        }
      }
      onChange(newValue); // Call the parent's onChange with the updated config
    },
    [value, onChange]
  );

  // Assuming only one section for now, as in the default config
  const section = value?.sections?.[0];

  if (!section) {
    return (
      <p className="text-sm text-danger-main">
        Error: Application configuration structure is invalid.
      </p>
    );
  }

  // Sort fields by order before rendering
  const sortedFields = [...section.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full p-4 bg-neutral-10 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-30 flex flex-col justify-start items-start gap-4">
      <div className="self-stretch justify-start text-neutral-90 text-base font-bold">
        {section.title}
      </div>
      {/* Container for the list of fields */}
      <div className="w-full flex flex-col justify-start items-start">
        {sortedFields.map((field, index) => {
          const currentState = getFieldState(field);
          const isLastRow = index === sortedFields.length - 1;

          return (
            <div
              key={field.key}
              // Add data attributes if needed for styling consistency with the example
              // data-list="true"
              // data-last-row={isLastRow ? "true" : "false"}
              className="self-stretch bg-neutral-10 flex flex-col justify-start items-start"
            >
              {/* Row content */}
              <div className="self-stretch p-2 inline-flex flex-wrap justify-start items-center gap-4">
                {/* Field Label */}
                <div className="flex-1 flex justify-start items-center gap-2 min-w-[150px]">
                  {" "}
                  {/* Added min-width */}
                  <div className="justify-start text-neutral-90 text-base">
                    {field.label}
                  </div>
                </div>
                {/* State Chips */}
                <div className="flex justify-start items-center gap-2">
                  {(
                    ["Mandatory", "Optional", "Off"] as FieldRequirementState[]
                  ).map((stateOption) => (
                    <Chip
                      key={stateOption}
                      selected={currentState === stateOption}
                      onClick={() => handleStateChange(field.key, stateOption)}
                    >
                      {stateOption}
                    </Chip>
                  ))}
                </div>
              </div>
              {/* Separator (except for last row) */}
              {!isLastRow && (
                <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-30"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationConfigEditor;
