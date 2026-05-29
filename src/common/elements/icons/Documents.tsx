import src from "./assets/documents.png";
import Icon, { type IconProps } from "./Icon";

/** Documents */
export default function Documents(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Documents" {...props} />;
}
