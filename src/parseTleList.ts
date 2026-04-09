import { twoline2satrec } from "satellite.js";

export function* splitTle(raw: string) {
  const lines = raw.split("\n");
  let state: { name?: string; line1?: string } = {};

  for (const line of lines) {
    if (line.startsWith("1 ")) {
      state = {
        name: state.name,
        line1: line,
      };
    } else if (line.startsWith("2 ")) {
      if (state.line1) {
        yield {
          name: state.name,
          line1: state.line1,
          line2: line,
        };
      }

      state = {};
    } else {
      state = {
        name: line,
      };
    }
  }
}

export function parseTleList(raw: string) {
  return Array.from(splitTle(raw), ({ name, line1, line2 }) => ({
    noradCatId: parseInt(twoline2satrec(line1, line2).satnum),
    name: name?.trim(),
    line1,
    line2,
  }));
}
