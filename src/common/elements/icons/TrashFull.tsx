import src from "./assets/trash-full.png";
import Icon, { type IconProps } from "./Icon";

/** Recycle bin (full) */
export default function TrashFull(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Recycle bin (full)" {...props} />;
}
