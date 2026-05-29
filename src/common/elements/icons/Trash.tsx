import src from "./assets/trash.png";
import Icon, { type IconProps } from "./Icon";

/** Recycle bin (empty) */
export default function Trash(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Recycle bin (empty)" {...props} />;
}
