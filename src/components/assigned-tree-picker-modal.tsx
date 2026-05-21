"use client";

import { Modal, ModalClose, ModalContent, ModalDescription, ModalHeader } from "@/components/modal";
import { SearchField, appButtonClassName } from "@/components/ui/form-controls";
import Fuse from "fuse.js";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

export type AssignableTree = {
  common_name?: string | null;
  ecoslo_num: number;
  species_name?: string | null;
};

type AssignedTreePickerModalProps = {
  assignedTreeEcosloNumbers: number[];
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
        className="bg-card"
        closeOnOverlayClick={false}
        showCloseButton={false}
        widthClassName="w-full max-w-xl"
      >
        <AssignedTreePickerModalBody
          assignedTreeSet={assignedTreeSet}
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
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTree: (treeEcosloNumber: number) => void;
  trees: AssignableTree[];
};

function AssignedTreePickerModalBody({
  assignedTreeSet,
  isLoading,
  onOpenChange,
  onSelectTree,
  trees,
}: AssignedTreePickerModalBodyProps) {
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleTreeSelect = (treeEcosloNumber: number) => {
    onSelectTree(treeEcosloNumber);
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

        <div className="flex max-h-80 flex-col gap-y-2 overflow-y-auto">
          {isLoading ? (
            <p className="rounded-lg border border-border bg-button-muted p-3 font-medium text-text-muted">
              Loading trees...
            </p>
          ) : filteredTrees.length > 0 ? (
            filteredTrees.map((tree) => {
              const isAssigned = assignedTreeSet.has(tree.ecoslo_num);

              return (
                <button
                  type="button"
                  className={appButtonClassName({
                    className: "w-full justify-between whitespace-normal rounded-lg px-3 py-3 text-left",
                    radius: "small",
                    variant: "secondary",
                  })}
                  disabled={isAssigned}
                  key={tree.ecoslo_num}
                  onClick={() => handleTreeSelect(tree.ecoslo_num)}
                >
                  <span>{`${getTreeDisplayName(tree)} #${tree.ecoslo_num}`}</span>
                  {isAssigned ? <span className="text-sm text-text-muted">Assigned</span> : null}
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
    </>
  );
}
