import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "npm:@react-email/components@0.0.36";
import * as React from "npm:react@19.0.0";

export type TaskEmailProps = {
  firstname: string;
  title: string;
  message: string;
};

// Styling mirrors the sign-in email (src/components/MagicLinkEmailTemplate.tsx)
// and globals.css so ECOSLO's emails read as one family. Inline styles only —
// email clients ignore <style> tags and don't run Tailwind.
export function TaskEmail({ firstname, title, message }: TaskEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>New task: {title}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={brandStyle}>🌳 ECOSLO</Text>
          <Heading as="h2" style={headingStyle}>
            Hi {firstname},
          </Heading>
          <Text style={textStyle}>You have a new task:</Text>
          <Section style={taskCardStyle}>
            <Heading as="h3" style={taskTitleStyle}>
              {title}
            </Heading>
            <Text style={taskMessageStyle}>{message}</Text>
          </Section>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>This is an automated reminder from ECOSLO. 🌱</Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f2f0ed",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: "#6a5f52",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  maxWidth: "480px",
  borderRadius: "12px",
  border: "1px solid #dedbd2",
};

const brandStyle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "0.02em",
  color: "#7b8963",
  margin: "0 0 28px",
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "24px",
  fontWeight: 600,
  color: "#000000",
  margin: "0 0 12px",
};

const textStyle: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#6a5f52",
  margin: "0 0 16px",
};

const taskCardStyle: React.CSSProperties = {
  backgroundColor: "#f2f0ed",
  border: "1px solid #dedbd2",
  borderRadius: "8px",
  padding: "20px",
  margin: 0,
};

const taskTitleStyle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "17px",
  fontWeight: 600,
  color: "#000000",
  margin: "0 0 8px",
};

const taskMessageStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6a5f52",
  margin: 0,
  whiteSpace: "pre-wrap",
};

const hrStyle: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid #dedbd2",
  margin: "28px 0",
};

const footerStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#7d7469",
  margin: 0,
};
