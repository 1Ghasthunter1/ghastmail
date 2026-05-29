import src from "./assets/openai.png";
import Icon, { type IconProps } from "./Icon";

/** OpenAI / ChatGPT */
export default function OpenAI(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="OpenAI" {...props} />;
}
