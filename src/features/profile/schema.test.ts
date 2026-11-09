import { describe, expect, it } from "vitest";
import { initials, passwordSchema } from "./schema";

describe("initials", () => {
  it("primeira e última inicial", () => {
    expect(initials("Maria da Silva")).toBe("MS");
    expect(initials("  joão ")).toBe("J");
    expect(initials(null)).toBe("?");
  });
});

describe("passwordSchema", () => {
  const ok = {
    current: "antiga123",
    password: "novaSenha1",
    confirm: "novaSenha1",
  };
  const paths = (v: typeof ok) =>
    passwordSchema.safeParse(v).error?.issues.map((i) => i.path[0]) ?? [];

  it("aceita senha nova confirmada", () => expect(paths(ok)).toEqual([]));
  it("confirmação diferente e senha curta", () => {
    expect(paths({ ...ok, confirm: "outra" })).toEqual(["confirm"]);
    expect(paths({ ...ok, password: "curta", confirm: "curta" })).toEqual([
      "password",
    ]);
  });
  it("não aceita repetir a atual", () => {
    expect(
      paths({
        current: "mesma1234",
        password: "mesma1234",
        confirm: "mesma1234",
      }),
    ).toEqual(["password"]);
  });
});
