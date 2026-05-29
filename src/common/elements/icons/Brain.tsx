import src from "./assets/brain.png";
import Icon, { type IconProps } from "./Icon";

/** Brain */
export default function Brain(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Brain" {...props} />;
}
