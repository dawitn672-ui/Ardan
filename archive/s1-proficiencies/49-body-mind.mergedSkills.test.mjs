// Retired by S1b (D-072): 49-body-mind's mergedSkills test (the player-only merge it tested is retired; the legacy keys
// are specialisms for everyone, tested by 36-skills' s1Migrate and tests/v2/skills.test.js).
export default {
  async mergedSkills(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4960, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 25 });
      const pc = A.pc(); pc.skills.bow = 10; pc.skills.xbow = 0;
      const g = A.trainSkill(pc, 'xbow', 3);
      const read = [A.skill(pc, 'xbow'), A.skill(pc, 'bow')];
      // an old save: points in a merged skill fold into the family's
      const S = JSON.parse(A.serialize()); S.people[S.pc].skills.lance = 44; S.people[S.pc].skills.riding = 12; delete S.people[S.pc].ill;
      A.deserialize(JSON.stringify(S));
      const p2 = A.pc(), fold = [p2.skills.riding, A.skill(p2, 'lance')];
      // an NPC keeps its own numbers
      const npc = Object.values(A.S.people).find(p => p.id !== A.S.pc && p.skills); npc.skills.dagger = 33; npc.skills.sword = 5;
      // C9 (D-040): a skill past what its body carries works lower (A.skillCap); give this NPC a body that carries it
      npc.st.spd = Math.max(npc.st.spd, 60); npc.st.ins = Math.max(npc.st.ins, 60); npc.born = A.S.year - 30; npc.flags = Object.assign({}, npc.flags, { weary: false });
      const npcRead = [A.skill(npc, 'dagger'), A.skill(npc, 'sword')];
      UI.ov = null; T.enter({ seed: 4961, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 25 });
      const p3 = A.pc(); p3.skills.dagger = 20; p3.skills.sword = 20; p3.skills.xbow = 15; p3.skills.bow = 15;
      const block = UI.profBlock(p3), shows = { dagger: block.includes('>' + GD.SKILLS.dagger + ' ') || block.includes(GD.SKILLS.dagger + '</span>'), blades: block.includes('Swordsmanship') };
      const picker = (A.trainTargets(p3) || []).map(x => x.k);
      return { g, read, fold, npcRead, shows, pickerHasAlias: picker.some(k => A.BM.MERGE[k]), merged: Object.keys(A.BM.MERGE).length };
    });
    const ok = r.g > 0 && r.read[0] === r.read[1] && r.read[1] > 10 && r.fold[0] === 44 && r.fold[1] === 44 && r.npcRead[0] === 33 && r.npcRead[1] === 5 && !r.shows.dagger && r.shows.blades && !r.pickerHasAlias;
    return { ok, detail: `${r.merged} skills merged; training crossbow raised bow to ${r.read[1]} (crossbow reads ${r.read[0]}); an old save's lance 44 over riding 12 folds to riding ${r.fold[0]}; an NPC's dagger stays ${r.npcRead[0]} beside sword ${r.npcRead[1]}; ` +
      `the sheet shows Swordsmanship ${r.shows.blades} and no dagger row ${!r.shows.dagger}; merged skills in the training picker ${r.pickerHasAlias}` };
  },

};
