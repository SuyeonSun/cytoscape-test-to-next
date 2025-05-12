import { useAtomValue } from "jotai";
import { graphDataAtom } from "@/lib/graphAtoms";

export default function GraphSummary() {
  const graph = useAtomValue(graphDataAtom);

  return (
    <>
      <p>node 수: {graph.nodes.length}</p>
      <p>edge 수: {graph.edges.length}</p>
    </>
  );
}
