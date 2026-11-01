// 9990-journeys: the release's A.travelTo still makes the move at the end of the road (9990 calls it on arrival), but
// the road already had its scenes, so its one random road scene is not drawn then.
export default [
  {
    id: 'JR-ROAD-SCENE', blob: 'ardan-core',
    why: 'Porting: when travel is a journey with stops, the single "45% of long trips get a road scene" roll at the moment of moving is skipped for a move made at the end of a journey (A.JR.arriving).',
    edits: [['opt.d>300&&A.chance(.45)&&A.queue(', 'opt.d>300&&!(A.JR&&A.JR.arriving)&&A.chance(.45)&&A.queue(']],
  },
];
