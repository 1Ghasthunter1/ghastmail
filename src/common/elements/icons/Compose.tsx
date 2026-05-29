import src from "./assets/compose.png";
import Icon, { type IconProps } from "./Icon";

/** Compose */
export default function Compose(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Compose" {...props} />;
}
