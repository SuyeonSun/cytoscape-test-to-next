import cytoscape from "cytoscape";
import cxtmenu from "cytoscape-cxtmenu";

let isCxtmenuRegistered = false;

if (!isCxtmenuRegistered && !cytoscape.prototype.hasOwnProperty("cxtmenu")) {
  cytoscape.use(cxtmenu);
  isCxtmenuRegistered = true;
}

export default cytoscape;
