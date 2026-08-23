"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/ui/searchBar";
import Button from "@/components/ui/button";
import { ContactFormModal } from "../ContactFormModal";
import {
  useBusinessContacts,
  useDeleteBusinessContact,
} from "@/hooks/useBusinessContacts";
import { BusinessContact, BusinessContactType } from "@repo/shared";

const PAGE_SIZE = 25;

export function CustomersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<BusinessContact | null>(
    null,
  );

  const { data, isLoading } = useBusinessContacts({
    type: BusinessContactType.CUSTOMER,
    page,
    pageSize: PAGE_SIZE,
    search,
  });
  const customers = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const { mutate: deleteContact } = useDeleteBusinessContact();

  function handleDelete(id: string) {
    if (confirm("Delete this customer?")) {
      deleteContact(id);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openAddModal() {
    setEditingContact(null);
    setModalOpen(true);
  }

  function openEditModal(contact: BusinessContact) {
    setEditingContact(contact);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingContact(null);
  }

  const columns: DataTableColumn<BusinessContact>[] = [
    {
      key: "index",
      title: "#",
      width: 60,
      render: (_row, index) => (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "name",
      dataKey: "name",
      title: "Name",
      render: (row) => row.name,
    },
    {
      key: "phone",
      title: "Phone",
      render: (row) => row.phone ?? "—",
    },
    {
      key: "address",
      title: "Address",
      render: (row) => row.address ?? "—",
    },
    {
      key: "isActive",
      title: "Status",
      width: 100,
      render: (row) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      title: "",
      width: 40,
      align: "center",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.id);
          }}
          className="text-[var(--color-text-placeholder)] transition-colors hover:text-[var(--color-danger-text)]"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          entityLabelPlural="Customers"
          count={meta?.total ?? 0}
        />
        <Button onClick={openAddModal}>
          <Plus size={16} />
          Add Customer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={isLoading}
        emptyTitle="No customers found"
        onRowClick={openEditModal}
        emptyDescription="Try adjusting your search."
        footer={
          meta && meta.totalPages > 0 ? (
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
              itemsPerPage={meta.pageSize}
              totalItems={meta.total}
            />
          ) : null
        }
      />

      <ContactFormModal
        open={modalOpen}
        onClose={closeModal}
        type={BusinessContactType.CUSTOMER}
        entityLabel="Customer"
        contact={editingContact}
      />
    </div>
  );
}
