import { CompareExplorer } from "@/components/compare-explorer";

export default function ComparePage() {
  return (
    <>
      <h1>Compare</h1>
      <p className="muted">Choose any two player or club records to compare their available statistics.</p>
      <CompareExplorer />
    </>
  );
}
