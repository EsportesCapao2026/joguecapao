"use client";

import { Trash2 } from "lucide-react";

type Props = {
  label: string;
  confirmMessage: string;
};

export function AdminDeleteSubmitButton({ label, confirmMessage }: Props) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-red-100 transition hover:bg-red-500/20"
    >
      <Trash2 size={16} />
      {label}
    </button>
  );
}
