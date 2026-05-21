"use client";

import Badge from "@/components/badge";
import { MemberSchema } from "@/components/data-table/table-widget-defs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dropdown-menu";
import { Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader } from "@/components/modal";
import VolunteerAssignedTreePickerModal, { AssignableTree } from "@/components/assigned-tree-picker-modal";
import {
  AppButton,
  appButtonClassName,
  dropdownContentClassName,
  dropdownItemClassName,
  selectTriggerClassName,
  textFieldClassName,
} from "@/components/ui/form-controls";
import { Database } from "@/database/database.types";
import { ChevronDown, Pencil, Plus, Trash2, Undo2, UserRoundCog, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

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

function MemberRoleBadge({ role }: { role: MemberRole | string }) {
  const isAdmin = String(role).toLowerCase() === "admin";

  return (
    <Badge
      variant={isAdmin ? "info" : "success"}
      size="sm"
      icon={isAdmin ? <UserRoundCog className="h-4 w-4" /> : undefined}
      className="shrink-0 capitalize"
    >
      {String(role)}
    </Badge>
  );
}

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
    `${memberForm.firstname} ${memberForm.lastname}`.trim() || (isAddingMember ? "Add Member" : "Member");
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
    /* eslint-disable react-hooks/set-state-in-effect -- reset form state when dialog opens */
    setMemberForm(member ? memberToForm(member) : createBlankMemberForm());
    setIsEditing(member ? false : true);
    setFormError(null);
    setDeleteError(null);
    setAssignableTrees([]);
    setAssignedTreesError(null);
    setIsTreePickerOpen(false);
    setDeleteConfirmationOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, member]);

  useEffect(() => {
    if (!open) {
      /* eslint-disable react-hooks/set-state-in-effect -- reset state when dialog closes */
      setAssignableTrees([]);
      setAssignedTreesError(null);
      setAreAssignedTreesLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
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
              : "Failed to delete member";

        throw new Error(errorMessage);
      }

      setDeleteConfirmationOpen(false);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete member");
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
              : "Failed to save member";

        throw new Error(errorMessage);
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange}>
        <ModalContent className="bg-off-white" closeOnOverlayClick={false} showCloseButton={false}>
          <form onSubmit={handleMemberSubmit}>
            <ModalHeader className="flex flex-col gap-y-4">
              <div className="flex items-center justify-between gap-x-4">
                <div className="flex gap-x-4 items-center">
                  <h2 className="text-[1.75rem] text-text-dark font-serif font-extrabold capitalize">
                    {displayedName}
                  </h2>
                  <MemberRoleBadge role={displayedRole} />
                </div>
                <div className="flex gap-x-2">
                  <button
                    type="button"
                    className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
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
                    className={appButtonClassName({ iconOnly: true, variant: "danger" })}
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
                      className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
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
                <p className="text-lg font-serif font-bold text-text-dark pb-4">Contact Information</p>
                <div className="flex flex-col gap-y-4">
                  <div className="flex gap-x-4">
                    <div className="flex-1 flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-semibold">
                        <span>First Name</span>
                        {isEditing && <span className="text-destructive font-semibold"> *</span>}
                      </p>
                      {isEditing ? (
                        <input
                          className={cn(textFieldClassName, "bg-button-muted")}
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
                      <p className="text-text-muted font-semibold">
                        <span>Last Name</span>
                        {isEditing && <span className="text-destructive font-semibold"> *</span>}
                      </p>
                      {isEditing ? (
                        <input
                          className={cn(textFieldClassName, "bg-button-muted")}
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
                      <p className="text-text-muted font-semibold">Phone</p>
                      {isEditing ? (
                        <input
                          className={cn(textFieldClassName, "bg-button-muted")}
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
                      <p className="text-text-muted font-semibold">
                        <span>Role</span>
                        {isEditing && <span className="text-destructive font-semibold"> *</span>}
                      </p>
                      {isEditing ? (
                        <DropdownMenu open={roleMenuOpen} onOpenChange={setRoleMenuOpen}>
                          <DropdownMenuTrigger className={cn(selectTriggerClassName, "bg-button-muted")}>
                            <span>{memberForm.role}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                                roleMenuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className={dropdownContentClassName}>
                            {memberRoleOptions.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                className={dropdownItemClassName}
                                onClick={() => handleRoleChange(role)}
                              >
                                {role}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <MemberRoleBadge role={displayedRole} />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Email</p>
                    {isEditing ? (
                      <input
                        type="email"
                        className={cn(textFieldClassName, "bg-button-muted")}
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
                    <p className="text-text-muted font-semibold">
                      <span>Joined Date</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        type="date"
                        className={cn(textFieldClassName, "bg-button-muted")}
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
                  <p className="text-lg font-serif font-bold text-text-dark">{`Assigned Trees (${memberForm.assignedTreeEcosloNumbers.length})`}</p>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {isEditing ? (
                      <button
                        type="button"
                        className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
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
                          className="flex w-full items-center justify-between gap-x-3 rounded-lg border border-border bg-off-white p-1 pl-3"
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
                                className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
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
                  <AppButton
                    type="button"
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenChange(false);
                    }}
                  >
                    Cancel
                  </AppButton>
                  <AppButton disabled={isSubmitting || !hasFormChanges} type="submit">
                    {isAddingMember ? "Add Member" : "Save Changes"}
                  </AppButton>
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
              <h2 className="w-full text-center text-2xl text-text-dark font-serif font-extrabold">{`Delete ${displayedName}`}</h2>
            </div>
          </ModalHeader>
          <ModalDescription className="flex flex-col gap-y-4 pt-1 pb-4">
            <p className="w-full text-center text-text-muted">This action cannot be undone.</p>
            {deleteError ? <p className="text-destructive font-medium">{deleteError}</p> : null}
          </ModalDescription>
          <ModalFooter>
            <div className="w-full flex justify-center gap-x-4">
              <AppButton type="button" variant="secondary" onClick={() => setDeleteConfirmationOpen(false)}>
                Cancel
              </AppButton>
              <AppButton
                icon={Trash2}
                variant="danger"
                disabled={isDeleting}
                onClick={handleDeleteVolunteer}
                type="button"
              >
                {isDeleting ? "Deleting..." : "Delete Member"}
              </AppButton>
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
