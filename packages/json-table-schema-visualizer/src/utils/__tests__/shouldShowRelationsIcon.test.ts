import { shouldShowRelationsIcon } from "../shouldShowRelationsIcon";

describe("shouldShowRelationsIcon", () => {
  test("shows when hovered", () => {
    expect(shouldShowRelationsIcon(true, false)).toBe(true);
  });
  test("shows when hidden even if not hovered", () => {
    expect(shouldShowRelationsIcon(false, true)).toBe(true);
  });
  test("shows when both", () => {
    expect(shouldShowRelationsIcon(true, true)).toBe(true);
  });
  test("hidden icon when neither", () => {
    expect(shouldShowRelationsIcon(false, false)).toBe(false);
  });
});
