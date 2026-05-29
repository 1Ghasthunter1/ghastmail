import src from "./assets/page.png";
import Icon, { type IconProps } from "./Icon";

/** Page */
export default function Page(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Page" {...props} />;
}
