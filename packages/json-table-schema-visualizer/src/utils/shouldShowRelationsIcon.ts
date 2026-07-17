export function shouldShowRelationsIcon(
  isHovered: boolean,
  isHidden: boolean,
): boolean {
  return isHovered || isHidden;
}
