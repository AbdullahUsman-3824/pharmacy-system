"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { SearchBar } from "@/components/ui/searchBar";
import Button from "@/components/ui/button";
import { UserFormModal } from "./UserFormModal";
import { useUsers, useDeleteUser } from "@/hooks/useUser";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { UserResponse } from "@repo/shared";

export function UsersTable() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

  const { data, isLoading } = useUsers({ search });
  const users = useMemo(() => data ?? [], [data]);

  const { mutate: deleteUser } = useDeleteUser();
  const { requireAdmin } = useRequireAdmin();

  async function handleDelete(id: string) {
    try {
      await requireAdmin();
      if (confirm("Delete this user?")) {
        deleteUser(id);
      }
    } catch {}
  }

  async function openAddModal() {
    try {
      await requireAdmin();
      setEditingUser(null);
      setModalOpen(true);
    } catch {}
  }

  async function openEditModal(user: UserResponse) {
    try {
      await requireAdmin();
      setEditingUser(user);
      setModalOpen(true);
    } catch {}
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
  }

  const columns: DataTableColumn<UserResponse>[] = [
    {
      key: "index",
      title: "#",
      width: 60,
      render: (_row, index) => index + 1,
    },
    {
      key: "name",
      dataKey: "name",
      title: "Name",
      render: (row) => row.name,
    },
    {
      key: "type",
      title: "Type",
      render: (row) => (row.type === "OWNER" ? "Owner" : "Staff"),
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
          onChange={setSearch}
          entityLabelPlural="Users"
          count={users.length}
        />
        <Button onClick={openAddModal}>
          <Plus size={16} />
          Add User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        emptyTitle="No users found"
        onRowClick={openEditModal}
        emptyDescription="Try adjusting your search."
      />

      <UserFormModal open={modalOpen} onClose={closeModal} user={editingUser} />
    </div>
  );
}
