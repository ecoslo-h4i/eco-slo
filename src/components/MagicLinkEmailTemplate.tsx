import Link from "next/link";

export interface EmailTemplateProps {
  redirectTo: string;
}

export function EmailTemplate(props: EmailTemplateProps) {
  return (
    <div>
      <h1>Hello! Click the link below to sign into ECOSLO!</h1>
      <p className="text-center">
        <a href={props.redirectTo}>Click Here</a>
      </p>
    </div>
  );
}
