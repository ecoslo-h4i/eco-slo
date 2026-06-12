"use client";

import { Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader } from "@/components/modal";
import { AppButton, SearchField, appButtonClassName } from "@/components/ui/form-controls";
import Fuse from "fuse.js";
import { ArrowRightLeft, X } from "lucide-react";
import { useMemo, useState } from "react";

export type AssignableTree = {
  common_name?: string | null;
  ecoslo_num: number;
  species_name?: string | null;
  tree_keeper_id?: number | null;
  tree_keeper?: { firstname: string; lastname: string } | null;
};

type AssignedTreePickerModalProps = {
  assignedTreeEcosloNumbers: number[];
  currentMemberId: number | null;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTree: (treeEcosloNumber: number) => void;
  open: boolean;
  trees: AssignableTree[];
};

function getTreeDisplayName(tree: AssignableTree) {
  const speciesName = tree.species_name?.trim() || "N/A";
  const commonName = tree.common_name?.trim() || "N/A";

  return `${speciesName} | ${commonName}`;
}

export default function AssignedTreePickerModal({
  assignedTreeEcosloNumbers,
  currentMemberId,
  isLoading,
  onOpenChange,
  onSelectTree,
  open,
  trees,
}: AssignedTreePickerModalProps) {
  const assignedTreeSet = useMemo(() => new Set(assignedTreeEcosloNumbers), [assignedTreeEcosloNumbers]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="bg-off-white"
        closeOnOverlayClick={false}
        showCloseButton={false}
        widthClassName="w-full max-w-xl"
      >
        <AssignedTreePickerModalBody
          assignedTreeSet={assignedTreeSet}
          currentMemberId={currentMemberId}
          isLoading={isLoading}
          onOpenChange={onOpenChange}
          onSelectTree={onSelectTree}
          trees={trees}
        />
      </ModalContent>
    </Modal>
  );
}

type AssignedTreePickerModalBodyProps = {
  assignedTreeSet: Set<number>;
  currentMemberId: number | null;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTree: (treeEcosloNumber: number) => void;
  trees: AssignableTree[];
};

function getKeeperName(tree: AssignableTree) {
  if (!tree.tree_keeper) return null;
  return `${tree.tree_keeper.firstname} ${tree.tree_keeper.lastname}`.trim() || null;
}

function AssignedTreePickerModalBody({
  assignedTreeSet,
  currentMemberId,
  isLoading,
  onOpenChange,
  onSelectTree,
  trees,
}: AssignedTreePickerModalBodyProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [transferConfirmTree, setTransferConfirmTree] = useState<AssignableTree | null>(null);
  const fuse = useMemo(
    () =>
      new Fuse(trees, {
        includeScore: true,
        keys: ["common_name", "species_name", "ecoslo_num"],
        threshold: 0.3,
      }),
    [trees],
  );

  const filteredTrees = useMemo(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) return fuse.search(trimmedQuery).map((result) => result.item);

    return [...trees].sort((firstTree, secondTree) => firstTree.ecoslo_num - secondTree.ecoslo_num);
  }, [fuse, searchQuery, trees]);

  const handleTreeSelect = (tree: AssignableTree) => {
    const isOwnedByAnother = tree.tree_keeper_id != null && tree.tree_keeper_id !== currentMemberId;

    if (isOwnedByAnother) {
      setTransferConfirmTree(tree);
      return;
    }

    onSelectTree(tree.ecoslo_num);
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleTransferConfirm = () => {
    if (!transferConfirmTree) return;
    onSelectTree(transferConfirmTree.ecoslo_num);
    setTransferConfirmTree(null);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <>
      <ModalHeader>
        <div className="flex items-center justify-between gap-x-4">
          <h2 className="text-2xl text-text-dark font-serif font-extrabold">Assign Tree</h2>
          <ModalClose asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-transparent transition-colors duration-100 hover:bg-text/5"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5 text-text-muted" />
            </button>
          </ModalClose>
        </div>
      </ModalHeader>
      <ModalDescription className="flex flex-col gap-y-4 pt-4">
        <SearchField placeholder="Search trees..." value={searchQuery} onQueryChange={setSearchQuery} />

        <div className="flex max-h-80 flex-col gap-y-2 overflow-y-auto bg-card p-4 rounded-xl border border-border">
          {isLoading ? (
            <p className="rounded-lg border border-border bg-button-muted p-3 font-medium text-text-muted">
              Loading trees...
            </p>
          ) : filteredTrees.length > 0 ? (
            filteredTrees.map((tree) => {
              const isAssigned = assignedTreeSet.has(tree.ecoslo_num);
              const otherKeeperName =
                tree.tree_keeper_id != null && tree.tree_keeper_id !== currentMemberId ? getKeeperName(tree) : null;

              return (
                <button
                  type="button"
                  className={appButtonClassName({
                    className: "w-full justify-start whitespace-normal rounded-lg px-3 py-3 text-left bg-off-white",
                    radius: "small",
                    variant: "secondary",
                  })}
                  disabled={isAssigned}
                  key={tree.ecoslo_num}
                  onClick={() => handleTreeSelect(tree)}
                >
                  <span className="flex-1">{`${getTreeDisplayName(tree)} #${tree.ecoslo_num}`}</span>
                  {isAssigned ? (
                    <span className="text-sm text-text-muted ml-auto shrink-0">Assigned</span>
                  ) : otherKeeperName ? (
                    <span className="text-sm text-info ml-auto shrink-0">{otherKeeperName}</span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <p className="rounded-lg border border-border bg-button-muted p-3 font-medium text-text-muted">
              No trees found
            </p>
          )}
        </div>
      </ModalDescription>

      <Modal open={transferConfirmTree !== null} onOpenChange={() => setTransferConfirmTree(null)}>
        <ModalContent
          className="bg-card"
          closeOnOverlayClick={false}
          showCloseButton={false}
          widthClassName="px-6 md:px-8"
        >
          <ModalHeader>
            <div className="flex items-center justify-between gap-x-4">
              <h2 className="w-full text-center text-2xl text-text-dark font-serif font-extrabold">Transfer Tree</h2>
            </div>
          </ModalHeader>
          <ModalDescription className="flex flex-col gap-y-4 pt-1 pb-4">
            <p className="w-full text-center text-text-muted">
              {transferConfirmTree
                ? `This tree is currently assigned to ${getKeeperName(transferConfirmTree) ?? "another member"}. Assigning it will transfer it from them.`
                : ""}
            </p>
          </ModalDescription>
          <ModalFooter>
            <div className="w-full flex justify-center gap-x-4">
              <AppButton type="button" variant="secondary" onClick={() => setTransferConfirmTree(null)}>
                Cancel
              </AppButton>
              <AppButton icon={ArrowRightLeft} onClick={handleTransferConfirm} type="button">
                Transfer
              </AppButton>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
