import src from "./assets/browser.png";
import Icon, { type IconProps } from "./Icon";

/** Browser */
export default function Browser(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Browser" {...props} />;
}
