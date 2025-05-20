// src/lib/cytoscapeWithExtensions.ts

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import cxtmenu from 'cytoscape-cxtmenu'; // 또는 "@/lib/cytoscape-cxtmenu" 사용 중이라면 거기에서 import
import nodeHtmlLabel from 'cytoscape-node-html-label';

let registered = false;

if (!registered) {
    cytoscape.use(dagre);
    cytoscape.use(cxtmenu);
    cytoscape.use(nodeHtmlLabel);
    registered = true;
}

export default cytoscape;
