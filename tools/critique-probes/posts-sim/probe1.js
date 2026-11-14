async function main() {
  A.newGame({ seed: 11, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
  const pc = A.pc();
  const C = {};
  for (const k in GD.CAREERS) { const c = GD.CAREERS[k]; C[k] = { cat: c.cat, guild: !!c.guild, ranks: c.ranks.map(r => r[0]) }; }
  return { pc: { id: pc.id, mil: pc.mil, office: pc.office, job: pc.job, noble: pc.noble, status: pc.status }, careers: C, council: A.realm('POL-01').council, staffKeys: Object.keys(A.STAFF) };
}
