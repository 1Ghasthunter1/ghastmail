import src from "./assets/tree.png";
import Icon, { type IconProps } from "./Icon";

/** Tree */
export default function Tree(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Tree" {...props} />;
}
