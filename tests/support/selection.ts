/**
 * Minimal GraphQL selection-set reader for fixture-vs-query conformance
 * tests. It understands exactly what lib/wp/queries.ts and lib/wp/api.ts use:
 * one operation, field arguments, nested selections and inline fragments
 * (`... on Type { }`, merged into the parent). No aliases, no named fragments.
 */

export type Selection = { [field: string]: Selection | null };

export function parseSelection(query: string): Selection {
  const tokens = query.replace(/#.*$/gm, "").match(/\.\.\.|[{}()]|[^\s{}()]+/g) ?? [];
  let i = 0;

  const skipParens = () => {
    let depth = 0;
    do {
      if (tokens[i] === "(") depth++;
      if (tokens[i] === ")") depth--;
      i++;
    } while (depth > 0 && i < tokens.length);
  };

  const block = (): Selection => {
    const out: Selection = {};
    i++; // {
    while (i < tokens.length && tokens[i] !== "}") {
      if (tokens[i] === "...") {
        i++; // ...
        if (tokens[i] === "on") i += 2; // on Type
        Object.assign(out, block());
        continue;
      }
      const name = tokens[i++];
      if (tokens[i] === "(") skipParens();
      out[name] = tokens[i] === "{" ? block() : null;
    }
    i++; // }
    return out;
  };

  // Operation header: `query Name($a: T = 1) {`
  while (i < tokens.length && tokens[i] !== "{") {
    if (tokens[i] === "(") skipParens();
    else i++;
  }
  return block();
}

/** Differences between a selection and a response value ([] when identical). */
export function shapeProblems(selection: Selection, value: unknown, path = ""): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((item) => shapeProblems(selection, item, path));
  if (typeof value !== "object") return [`${path || "<root>"}: expected an object`];

  const record = value as Record<string, unknown>;
  const at = path || "<root>";
  const problems: string[] = [];
  for (const key of Object.keys(selection)) {
    if (!(key in record)) problems.push(`${at}: missing ${key}`);
  }
  for (const key of Object.keys(record)) {
    if (!(key in selection)) problems.push(`${at}: unselected ${key}`);
  }
  for (const [key, child] of Object.entries(selection)) {
    if (child && key in record) {
      problems.push(...shapeProblems(child, record[key], path ? `${path}.${key}` : key));
    }
  }
  return problems;
}
