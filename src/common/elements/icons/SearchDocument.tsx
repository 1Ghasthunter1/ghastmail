import src from "./assets/search-document.png";
import Icon, { type IconProps } from "./Icon";

/** Find file */
export default function SearchDocument(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Find file" {...props} />;
}
