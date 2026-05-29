import src from "./assets/document-program.png";
import Icon, { type IconProps } from "./Icon";

/** Program document */
export default function DocumentProgram(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Program document" {...props} />;
}
