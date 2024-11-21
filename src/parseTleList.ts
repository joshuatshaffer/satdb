import { Tle } from "ootk-core";

function* splitTle(raw: string) {
  const lines = raw.split("\n");
  let state: { objectName?: string; line1?: string } = {};

  for (const line of lines) {
    if (line.startsWith("1 ")) {
      state = {
        objectName: state.objectName,
        line1: line,
      };
    } else if (line.startsWith("2 ")) {
      if (state.line1) {
        yield {
          objectName: state.objectName,
          line1: state.line1,
          line2: line,
        };
      }

      state = {};
    } else {
      state = {
        objectName: line,
      };
    }
  }
}

export function parseTleList(raw: string) {
  return Array.from(splitTle(raw), ({ objectName, line1, line2 }) => ({
    noradCatId: Tle.satNum(line1 as any),
    name: objectName?.trim(),
    line1,
    line2,
  }));
}
