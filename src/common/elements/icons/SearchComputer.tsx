import src from "./assets/search-computer.png";
import Icon, { type IconProps } from "./Icon";

/** Find computer */
export default function SearchComputer(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Find computer" {...props} />;
}
