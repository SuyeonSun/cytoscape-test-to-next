import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

let isDagreRegistered = false;

if (!isDagreRegistered && !cytoscape.prototype.hasOwnProperty("dagre")) {
  cytoscape.use(dagre);
  isDagreRegistered = true;
}

export default cytoscape;
