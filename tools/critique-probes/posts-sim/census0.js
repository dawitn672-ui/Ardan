async function main(arg) {
  A.newGame({ seed: arg.seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
  const t0 = performance.now();
  const rows = [{ y: A.S.year, c: L.census() }];
  for (let y = 0; y < arg.years; y++) { T.play(1); rows.push({ y: A.S.year, c: L.census() }); }
  return { secsPerYear: (performance.now() - t0) / 1000 / arg.years, rows };
}
