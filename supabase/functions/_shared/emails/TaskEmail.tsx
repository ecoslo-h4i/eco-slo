import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "npm:@react-email/components@0.0.36";
import * as React from "npm:react@19.0.0";

export type TaskEmailProps = {
  firstname: string;
  title: string;
  message: string;
};

export function TaskEmail({ firstname, title, message }: TaskEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New task: {title}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
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
          <Text style={footerStyle}>This is an automated reminder from ECOSLO.</Text>
        </Container>
      </Body>
    </Html>
  );
}

// Inline styles because many email clients (Gmail, Outlook)
// strip <style> tags or don't honor external CSS.
const bodyStyle: React.CSSProperties = {
  backgroundColor: "#F2F0ED",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  margin: "40px auto",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const headingStyle: React.CSSProperties = {
  color: "#000000",
  fontSize: "20px",
  fontWeight: 600,
  marginTop: 0,
  marginBottom: "16px",
};

const textStyle: React.CSSProperties = {
  color: "#6A5F52",
  fontSize: "15px",
  lineHeight: "24px",
};

const taskCardStyle: React.CSSProperties = {
  backgroundColor: "#F2F0ED",
  border: "1px solid #DEDBD2",
  borderRadius: "6px",
  padding: "20px",
  margin: "20px 0",
};

const taskTitleStyle: React.CSSProperties = {
  color: "#000000",
  fontSize: "17px",
  fontWeight: 600,
  marginTop: 0,
  marginBottom: "8px",
};

const taskMessageStyle: React.CSSProperties = {
  color: "#6A5F52",
  fontSize: "14px",
  lineHeight: "22px",
  margin: 0,
  whiteSpace: "pre-wrap",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#DEDBD2",
  margin: "24px 0",
};

const footerStyle: React.CSSProperties = {
  color: "#7D7469",
  fontSize: "13px",
  marginBottom: 0,
};
