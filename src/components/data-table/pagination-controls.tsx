export default function PaginationControls() {
  return (
    <div className="w-full h-full flex justify-between items-center px-6">
      <div className="flex gap-2 items-center">
        <p className="text-text-dark font-medium">Rows per page:</p>
        <button className="w-12 px-3 py-1 bg-button-light border border-border text-text-dark rounded-xl">1</button>
        <p className="text-text-muted">
          Showing <span>1</span> of <span>10</span> of <span>100</span> trees
        </p>
      </div>
      <div className="flex gap-4 items-center">
        <button className="px-3 py-1 bg-button border border-border text-text-dark rounded-xl">Previous</button>
        <p className="text-text-dark">
          Page <span>1</span> of <span>10</span>
        </p>
        <button className="px-3 py-1 bg-button border border-border text-text-dark rounded-xl">Next</button>
      </div>
    </div>
  );
}
