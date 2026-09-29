interface RowActionsProps {
  /** What the row is, for screen readers: "Edit {itemLabel}", "Delete {itemLabel}". */
  itemLabel: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const buttonClass =
  'w-7 h-7 rounded-sm text-outline flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

/** Edit / delete icon buttons for a list row. */
export default function RowActions({ itemLabel, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${itemLabel}`}
          title="Edit"
          className={`${buttonClass} hover:text-primary hover:bg-primary/10`}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">edit</span>
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${itemLabel}`}
          title="Delete"
          className={`${buttonClass} hover:text-error hover:bg-error/10`}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      )}
    </div>
  );
}
