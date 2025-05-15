import cytoscape from "cytoscape";
import klay from "cytoscape-klay";

let isKlayRegistered = false;

if (!isKlayRegistered && !cytoscape.prototype.hasOwnProperty("klay")) {
  cytoscape.use(klay);
  isKlayRegistered = true;
}

export default cytoscape;
