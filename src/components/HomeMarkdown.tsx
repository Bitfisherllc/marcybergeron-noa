import { RichText } from "@/components/RichText";

type Props = {
  markdown: string;
  className?: string;
};

export function HomeMarkdown({ markdown, className = "" }: Props) {
  return (
    <RichText content={markdown} spacing="[&>*+*]:mt-6" className={`text-sm leading-relaxed text-muted ${className}`} />
  );
}
