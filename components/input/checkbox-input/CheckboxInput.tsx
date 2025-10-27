"use client";

import React from "react";
import { UilCheck, UilMinus } from "@iconscout/react-unicons";
// This is a helper component for the table's select column
export function CheckboxInput({
  indeterminate,
  className = "",
  index,
  ...rest
}: {
  indeterminate?: boolean;
  index: number | string;
} & React.HTMLProps<HTMLInputElement>) {
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    <>
      <input
        type="checkbox"
        id={"checkbox-input-" + index}
        ref={ref}
        className="hidden peer"
        {...rest}
      />
      <label
        htmlFor={"checkbox-input-" + index}
        className={
          className +
          "absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 peer-checked:[&>.check]:inline-flex peer-indeterminate:[&>.indeterminate]:inline-flex inline-flex items-center justify-between size-6 rounded-lg cursor-pointer bg-white border-primary-main peer-checked:bg-primary-main peer-indeterminate:bg-primary-main border-2"
        }
      >
        <UilCheck className="check hidden text-neutral-10 scale-125" />
        <UilMinus className="indeterminate hidden text-neutral-10" />
      </label>
    </>
  );
}
