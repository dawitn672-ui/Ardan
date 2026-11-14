// An AI world: a peasant who never enlists; census and census2 each year.
async function main(arg) {
  A.newGame({ seed: arg.seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
  const rows = [];
  const t0 = performance.now();
  for (let y = 0; y < arg.years; y++) { T.play(1); if (!A.pc() || !A.pc().alive) break; if ((y + 1) % (arg.every || 5) === 0 || y === arg.years - 1) rows.push({ y: A.S.year, c: L.census(), c2: L.census2() }); }
  return { seed: arg.seed, secsPerYear: (performance.now() - t0) / 1000 / arg.years, rows };
}
