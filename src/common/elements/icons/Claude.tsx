import src from "./assets/claude.png";
import Icon, { type IconProps } from "./Icon";

/** Claude */
export default function Claude(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Claude" {...props} />;
}
