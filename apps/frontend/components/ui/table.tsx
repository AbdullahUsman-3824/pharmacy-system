import {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  forwardRef,
} from "react";

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hover?: boolean;
  rounded?: boolean | null;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className = "",
      children,
      striped = false,
      hover = true,
      rounded = true,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={`
          w-full overflow-x-auto
          border border-[var(--color-border)]
          bg-[var(--color-card)]
          shadow-[var(--shadow-sm)]
          ${rounded !== false && rounded !== null ? "rounded-[var(--radius-md)]" : ""}
        `}
      >
        <table
          ref={ref}
          className={`w-full border-collapse text-sm ${className}`}
          data-striped={striped}
          data-hover={hover}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
);

Table.displayName = "Table";

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
  <thead
    ref={ref}
    className={`border-b border-[var(--color-border)] bg-[var(--color-background-muted)] ${className}`}
    {...props}
  />
));

TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
  <tbody ref={ref} className={className} {...props} />
));

TableBody.displayName = "TableBody";

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ selected = false, className = "", ...props }, ref) => (
    <tr
      ref={ref}
      className={`border-b border-[var(--color-border-light)] transition-colors duration-150 hover:bg-[var(--color-row-hover)] ${
        selected ? "bg-[var(--color-row-selected)]" : ""
      } ${className}`}
      {...props}
    />
  ),
);

TableRow.displayName = "TableRow";

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className = "", align = "left", ...props }, ref) => (
    <th
      ref={ref}
      className={`px-4 py-3 text-${align} text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] ${className}`}
      {...props}
    />
  ),
);

TableHead.displayName = "TableHead";

const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => (
  <td
    ref={ref}
    className={`px-4 py-3 align-middle text-[var(--color-text-secondary)] ${className}`}
    {...props}
  />
));

TableCell.displayName = "TableCell";

const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(({ className = "", ...props }, ref) => (
  <caption
    ref={ref}
    className={`px-4 py-3 text-left text-sm text-[var(--color-text-muted)] ${className}`}
    {...props}
  />
));

TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
