// 99991-v2-map: one hook. The world's provinces take the generated continent's geometry the moment they are made.
export default [
  {
    id: 'V2MAP-PROV', blob: 'ardan-core',
    why: 'Porting: when the world is created, right after the provinces are copied from the map as written, hand them to the map generator (A.V2MAP.onProv) so their positions, adjacency, coast, terrain, biome, height and size come from the generated continent before the realms read them.',
    edits: [['cells:p.cells,pid:p.pid}));for(const id in LORE.realms){', 'cells:p.cells,pid:p.pid}));A.V2MAP&&A.V2MAP.onProv&&A.V2MAP.onProv(S);for(const id in LORE.realms){']],
  },
];
