import { atom } from 'jotai';

export const graphDataAtom = atom({ nodes: [], edges: [] });

export const metricMapAtom = atom({
    salesProfit: 0,
    revenue: 0,
});
