"use client";

import Badge from "@/components/badge";
import { MemberSchema } from "@/components/data-table/table-widget-defs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dropdown-menu";
import { Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader } from "@/components/modal";
import VolunteerAssignedTreePickerModal, { AssignableTree } from "@/components/assigned-tree-picker-modal";
import { Database } from "@/database/database.types";
import { ChevronDown, Pencil, Plus, Trash2, Undo2, UserRoundCog, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type MemberRole = Database["public"]["Enums"]["MemberType"];

type MemberFormState = {
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  joined: string;
  role: MemberRole;
  assignedTreeEcosloNumbers: number[];
};

type AssignedTreeResponse = {
  message?: AssignableTree[];
  error?: unknown;
};

function isAssignableTree(value: unknown): value is AssignableTree {
  if (!value || typeof value !== "object") return false;

  const tree = value as {
    ecoslo_num?: number | null;
    species_name?: string | null;
    common_name?: string | null;
  };

  return typeof tree.ecoslo_num === "number";
}

const memberRoleOptions: MemberRole[] = ["Tree Keeper", "Admin"];

function getCurrentDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createBlankMemberForm(): MemberFormState {
  return {
    email: "",
    firstname: "",
    lastname: "",
    phone: "",
    joined: getCurrentDateInputValue(),
    role: "Tree Keeper",
    assignedTreeEcosloNumbers: [],
  };
}

function normalizePhoneNumber(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeDateInput(date: string) {
  const match = date.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? date.trim();
}

function normalizeAssignedTreeEcosloNumbers(treeEcosloNumbers: unknown) {
  return Array.isArray(treeEcosloNumbers)
    ? treeEcosloNumbers.filter((treeEcosloNumber): treeEcosloNumber is number => typeof treeEcosloNumber === "number")
    : [];
}

function memberToForm(member: MemberSchema): MemberFormState {
  return {
    email: member.email ?? "",
    firstname: member.firstname ?? "",
    lastname: member.lastname ?? "",
    phone: member.phone ?? "",
    joined: normalizeDateInput(member.joined ?? ""),
    role: member.role ?? "Tree Keeper",
    assignedTreeEcosloNumbers: normalizeAssignedTreeEcosloNumbers(member.trees_assigned),
  };
}

function normalizeMemberForm(form: MemberFormState): MemberFormState {
  return {
    email: form.email.trim(),
    firstname: form.firstname.trim(),
    lastname: form.lastname.trim(),
    phone: normalizePhoneNumber(form.phone),
    joined: normalizeDateInput(form.joined),
    role: form.role,
    assignedTreeEcosloNumbers: form.assignedTreeEcosloNumbers,
  };
}

function assignedTreeListsMatch(firstTreeEcosloNumbers: number[], secondTreeEcosloNumbers: number[]) {
  return (
    firstTreeEcosloNumbers.length === secondTreeEcosloNumbers.length &&
    firstTreeEcosloNumbers.every((treeEcosloNumber, index) => treeEcosloNumber === secondTreeEcosloNumbers[index])
  );
}

function memberFormsMatch(firstForm: MemberFormState, secondForm: MemberFormState) {
  const firstNormalizedForm = normalizeMemberForm(firstForm);
  const secondNormalizedForm = normalizeMemberForm(secondForm);

  return (
    firstNormalizedForm.email === secondNormalizedForm.email &&
    firstNormalizedForm.firstname === secondNormalizedForm.firstname &&
    firstNormalizedForm.lastname === secondNormalizedForm.lastname &&
    firstNormalizedForm.phone === secondNormalizedForm.phone &&
    firstNormalizedForm.joined === secondNormalizedForm.joined &&
    firstNormalizedForm.role === secondNormalizedForm.role &&
    assignedTreeListsMatch(
      firstNormalizedForm.assignedTreeEcosloNumbers,
      secondNormalizedForm.assignedTreeEcosloNumbers,
    )
  );
}

type VolunteerPageFormProps = {
  member: MemberSchema | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  open: boolean;
};

export default function VolunteerPageForm({ member, onOpenChange, onSaved, open }: VolunteerPageFormProps) {
  const [memberForm, setMemberForm] = useState<MemberFormState>(() => createBlankMemberForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  const [assignableTrees, setAssignableTrees] = useState<AssignableTree[]>([]);
  const [assignedTreesError, setAssignedTreesError] = useState<string | null>(null);
  const [areAssignedTreesLoading, setAreAssignedTreesLoading] = useState(false);
  const [isTreePickerOpen, setIsTreePickerOpen] = useState(false);

  const initialMemberForm = member ? memberToForm(member) : createBlankMemberForm();
  const hasFormChanges = !memberFormsMatch(memberForm, initialMemberForm);

  const isAddingMember = member === null;
  const displayedName =
    `${memberForm.firstname} ${memberForm.lastname}`.trim() || (isAddingMember ? "Add Volunteer" : "Volunteer");
  const displayedRole = memberForm.role;
  const assignedTreeLabelsByEcosloNumber = useMemo(
    () =>
      Object.fromEntries(
        assignableTrees.map((tree) => [
          tree.ecoslo_num,
          tree.common_name?.trim() || tree.species_name?.trim() || "(No tree found)",
        ]),
      ),
    [assignableTrees],
  );

  useEffect(() => {
    if (!open) return;

    setMemberForm(member ? memberToForm(member) : createBlankMemberForm());
    setIsEditing(member ? false : true);
    setFormError(null);
    setDeleteError(null);
    setAssignableTrees([]);
    setAssignedTreesError(null);
    setIsTreePickerOpen(false);
    setDeleteConfirmationOpen(false);
  }, [open, member]);

  useEffect(() => {
    if (!open) {
      setAssignableTrees([]);
      setAssignedTreesError(null);
      setAreAssignedTreesLoading(false);
      return;
    }

    let isMounted = true;

    async function loadAssignableTrees() {
      setAreAssignedTreesLoading(true);
      setAssignedTreesError(null);

      try {
        const response = await fetch("/api/admin/trees");
        const payload = (await response.json().catch(() => null)) as AssignedTreeResponse | null;

        if (!response.ok) {
          throw new Error("Failed to load assigned trees");
        }

        if (!isMounted) return;

        setAssignableTrees(Array.isArray(payload?.message) ? payload.message.filter(isAssignableTree) : []);
      } catch {
        if (!isMounted) return;

        setAssignableTrees([]);
        setAssignedTreesError("Failed to load all assigned trees");
      } finally {
        if (isMounted) setAreAssignedTreesLoading(false);
      }
    }

    loadAssignableTrees();

    return () => {
      isMounted = false;
    };
  }, [open]);

  const handleFormChange = (field: keyof MemberFormState) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setMemberForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value,
      }));
    };
  };

  const handleRoleChange = (role: MemberRole) => {
    setMemberForm((currentForm) => ({ ...currentForm, role }));
  };

  const handleAssignedTreeRemove = (treeEcosloNumberToRemove: number) => {
    setMemberForm((currentForm) => ({
      ...currentForm,
      assignedTreeEcosloNumbers: currentForm.assignedTreeEcosloNumbers.filter(
        (treeEcosloNumber) => treeEcosloNumber !== treeEcosloNumberToRemove,
      ),
    }));
  };

  const handleAssignedTreeAdd = (treeEcosloNumberToAdd: number) => {
    setMemberForm((currentForm) => {
      if (currentForm.assignedTreeEcosloNumbers.includes(treeEcosloNumberToAdd)) return currentForm;

      return {
        ...currentForm,
        assignedTreeEcosloNumbers: [...currentForm.assignedTreeEcosloNumbers, treeEcosloNumberToAdd],
      };
    });
  };

  const handleDeleteVolunteer = async () => {
    if (!member) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: "DELETE",
      });
      const responseBody = (await response.json().catch(() => null)) as { error?: unknown; message?: unknown } | null;

      if (!response.ok) {
        const errorMessage =
          typeof responseBody?.message === "string"
            ? responseBody.message
            : typeof responseBody?.error === "string"
              ? responseBody.error
              : "Failed to delete volunteer";

        throw new Error(errorMessage);
      }

      setDeleteConfirmationOpen(false);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete volunteer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMemberSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasFormChanges) return;

    const payload = {
      email: memberForm.email.trim(),
      firstname: memberForm.firstname.trim(),
      lastname: memberForm.lastname.trim(),
      phone: normalizePhoneNumber(memberForm.phone),
      joined: normalizeDateInput(memberForm.joined),
      role: memberForm.role,
      trees_assigned: memberForm.assignedTreeEcosloNumbers,
      trees_count: memberForm.assignedTreeEcosloNumbers.length,
    };

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(isAddingMember ? "/api/admin/members" : `/api/admin/members/${member.id}`, {
        method: isAddingMember ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responseBody = (await response.json().catch(() => null)) as { error?: unknown; message?: unknown } | null;

      if (!response.ok) {
        const errorMessage =
          typeof responseBody?.message === "string"
            ? responseBody.message
            : typeof responseBody?.error === "string"
              ? responseBody.error
              : "Failed to save volunteer";

        throw new Error(errorMessage);
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save volunteer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange}>
        <ModalContent className="bg-card" closeOnOverlayClick={false} showCloseButton={false}>
          <form onSubmit={handleMemberSubmit}>
            <ModalHeader className="flex flex-col gap-y-4">
              <div className="flex items-center justify-between gap-x-4">
                <div className="flex gap-x-4 items-center">
                  <h2 className="text-[1.75rem] text-text-dark font-[Constantia] font-extrabold capitalize">
                    {displayedName}
                  </h2>
                  {String(displayedRole).toLowerCase() === "admin" ? (
                    <Badge
                      variant="muted"
                      icon={<UserRoundCog className="w-4 h-4" />}
                      className="shrink-0 capitalize h-8"
                    >
                      {String(displayedRole)}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="shrink-0 capitalize h-8">
                      {String(displayedRole)}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-x-2">
                  <button
                    type="button"
                    className="flex items-center justify-center w-8 h-8 bg-transparent hover:bg-black/5 transition-colors duration-100 rounded-md disabled:hidden block"
                    disabled={isAddingMember}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsEditing((currentIsEditing) => !currentIsEditing);
                    }}
                  >
                    {isEditing ? (
                      <Undo2 className="w-5 h-5 text-text-muted" />
                    ) : (
                      <Pencil className="w-5 h-5 text-text-muted" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center w-8 h-8 bg-transparent hover:bg-destructive/15 rounded-md transition-colors duration-100 disabled:hidden block"
                    disabled={isAddingMember}
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteError(null);
                      setDeleteConfirmationOpen(true);
                    }}
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                  <ModalClose asChild>
                    <button
                      type="button"
                      className="flex items-center justify-center w-8 h-8 bg-transparent hover:bg-black/5 transition-colors duration-100 rounded-md"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenChange(false);
                      }}
                    >
                      <X className="w-5 h-5 text-text-muted" />
                    </button>
                  </ModalClose>
                </div>
              </div>
              <div className="bg-border h-px w-full" />
            </ModalHeader>
            <ModalDescription className="flex flex-col gap-y-4 py-4 overflow-y-auto max-h-[70vh]">
              <div className="bg-foreground p-4 border border-border rounded-xl">
                <p className="text-lg font-[Constantia] font-bold text-text-dark pb-4">Contact Information</p>
                <div className="flex flex-col gap-y-4">
                  <div className="flex gap-x-4">
                    <div className="flex-1 flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-medium">
                        <span>First Name</span>
                        {isEditing && <span className="text-destructive font-semibold"> *</span>}
                      </p>
                      {isEditing ? (
                        <input
                          className="w-full bg-button-muted rounded-xl px-3 py-2 placeholder:text-text-muted placeholder:font-normal text-text-dark font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-100"
                          onChange={handleFormChange("firstname")}
                          placeholder="John..."
                          required
                          value={memberForm.firstname}
                        />
                      ) : (
                        <p className="text-text-dark font-medium capitalize">{memberForm.firstname}</p>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-medium">
                        <span>Last Name</span>
                        {isEditing && <span className="text-destructive font-semibold"> *</span>}
                      </p>
                      {isEditing ? (
                        <input
                          className="w-full bg-button-muted rounded-xl px-3 py-2 placeholder:text-text-muted placeholder:font-normal text-text-dark font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-100"
                          onChange={handleFormChange("lastname")}
                          placeholder="Doe..."
                          required
                          value={memberForm.lastname}
                        />
                      ) : (
                        <p className="text-text-dark font-medium capitalize">{memberForm.lastname}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-x-4">
                    <div className="flex-1 flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-medium">Phone</p>
                      {isEditing ? (
                        <input
                          className="w-full bg-button-muted rounded-xl px-3 py-2 placeholder:text-text-muted placeholder:font-normal text-text-dark font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-100"
                          onChange={handleFormChange("phone")}
                          placeholder="(123) 456-7890..."
                          value={memberForm.phone}
                        />
                      ) : (
                        <p className="text-text-dark font-medium">
                          {memberForm.phone.length > 0 ? (
                            memberForm.phone
                          ) : (
                            <span className="text-text-muted">None provided</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-medium">
                        <span>Role</span>
                        {isEditing && <span className="text-destructive font-semibold"> *</span>}
                      </p>
                      {isEditing ? (
                        <DropdownMenu open={roleMenuOpen} onOpenChange={setRoleMenuOpen}>
                          <DropdownMenuTrigger className="w-full bg-button-muted rounded-xl px-3 py-2 placeholder:text-text-muted placeholder:font-normal text-text-dark font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-100 flex items-center justify-between">
                            <span>{memberForm.role}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                                roleMenuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {memberRoleOptions.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                className="font-medium"
                                onClick={() => handleRoleChange(role)}
                              >
                                {role}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : String(displayedRole).toLowerCase() === "admin" ? (
                        <Badge
                          variant="muted"
                          icon={<UserRoundCog className="w-4 h-4" />}
                          className="shrink-0 capitalize h-8"
                        >
                          {String(displayedRole)}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="shrink-0 capitalize h-8">
                          {String(displayedRole)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-medium">Email</p>
                    {isEditing ? (
                      <input
                        type="email"
                        className="w-full bg-button-muted rounded-xl px-3 py-2 placeholder:text-text-muted placeholder:font-normal text-text-dark font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-100"
                        onChange={handleFormChange("email")}
                        placeholder="john.doe@example.com..."
                        value={memberForm.email}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">
                        {memberForm.email.length > 0 ? (
                          memberForm.email
                        ) : (
                          <span className="text-text-muted">None provided</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-medium">
                      <span>Joined Date</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        type="date"
                        className="w-full bg-button-muted rounded-xl px-3 py-2 placeholder:text-text-muted placeholder:font-normal text-text-dark font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-100"
                        onChange={handleFormChange("joined")}
                        required
                        value={memberForm.joined}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{memberForm.joined}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-foreground p-4 border border-border rounded-xl">
                <div className="flex items-center justify-between gap-x-3 pb-4">
                  <p className="text-lg font-[Constantia] font-bold text-text-dark">{`Assigned Trees (${memberForm.assignedTreeEcosloNumbers.length})`}</p>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {isEditing ? (
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-text-muted transition-colors duration-100 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                        onClick={() => setIsTreePickerOpen(true)}
                        aria-label="Add assigned tree"
                      >
                        <Plus className="h-5 w-5 text-text-muted" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-y-2">
                  {memberForm.assignedTreeEcosloNumbers.length > 0 ? (
                    <>
                      {memberForm.assignedTreeEcosloNumbers.map((treeEcosloNumber) => (
                        <div
                          className="flex w-full items-center justify-between gap-x-3 rounded-lg border border-border bg-button-muted p-1 pl-3"
                          key={treeEcosloNumber}
                        >
                          <p className="text-text-dark font-medium">
                            {areAssignedTreesLoading
                              ? "Loading tree..."
                              : `${assignedTreeLabelsByEcosloNumber[treeEcosloNumber] ?? "(No tree found)"} #${treeEcosloNumber}`}
                          </p>
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                            {isEditing ? (
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-text-muted transition-colors duration-100 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                                onClick={() => handleAssignedTreeRemove(treeEcosloNumber)}
                                aria-label={`Remove assigned tree #${treeEcosloNumber}`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {assignedTreesError ? <p className="text-destructive font-medium">{assignedTreesError}</p> : null}
                    </>
                  ) : (
                    <p className="text-text-muted font-medium">No trees assigned</p>
                  )}
                </div>
              </div>
              {formError ? <p className="text-destructive font-medium">{formError}</p> : null}
            </ModalDescription>
            <ModalFooter>
              <div className="flex flex-col w-full gap-y-4">
                <div className="bg-border h-px w-full" />
                <div className="flex justify-end gap-x-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-text-dark bg-transparent border border-border rounded-full hover:bg-black/5 transition-colors duration-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenChange(false);
                    }}
                  >
                    <span className="font-medium">Cancel</span>
                  </button>
                  <button
                    className="px-4 py-2 bg-primary text-text-light border border-border text-text-dark rounded-full hover:bg-primary/90 transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting || !hasFormChanges}
                    type="submit"
                  >
                    <span className="font-medium">{isAddingMember ? "Add Member" : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <ModalContent className="bg-card" closeOnOverlayClick={false} showCloseButton={false} widthClassName="px-8">
          <ModalHeader>
            <div className="flex items-center justify-between gap-x-4">
              <h2 className="w-full text-center text-2xl text-text-dark font-[Constantia] font-extrabold">{`Delete ${displayedName}`}</h2>
            </div>
          </ModalHeader>
          <ModalDescription className="flex flex-col gap-y-4 pt-1 pb-4">
            <p className="w-full text-center text-text-muted">This action cannot be undone.</p>
            {deleteError ? <p className="text-destructive font-medium">{deleteError}</p> : null}
          </ModalDescription>
          <ModalFooter>
            <div className="w-full flex justify-center gap-x-4">
              <button
                type="button"
                className="px-4 py-2 text-text-dark bg-transparent border border-border rounded-full hover:bg-black/5 transition-colors duration-100"
                onClick={() => setDeleteConfirmationOpen(false)}
              >
                <span className="font-medium">Cancel</span>
              </button>
              <button
                className="flex gap-x-2 items-center px-4 py-2 bg-destructive text-text-light rounded-full hover:bg-destructive/90 transition-colors duration-100 disabled:opacity-60"
                disabled={isDeleting}
                onClick={handleDeleteVolunteer}
                type="button"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">{isDeleting ? "Deleting..." : "Delete Volunteer"}</span>
              </button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <VolunteerAssignedTreePickerModal
        assignedTreeEcosloNumbers={memberForm.assignedTreeEcosloNumbers}
        isLoading={areAssignedTreesLoading}
        onOpenChange={setIsTreePickerOpen}
        onSelectTree={handleAssignedTreeAdd}
        open={isTreePickerOpen}
        trees={assignableTrees}
      />
    </>
  );
}
