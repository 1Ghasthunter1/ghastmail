import src from "./assets/openrouter.png";
import Icon, { type IconProps } from "./Icon";

/** OpenRouter */
export default function OpenRouter(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="OpenRouter" {...props} />;
}
