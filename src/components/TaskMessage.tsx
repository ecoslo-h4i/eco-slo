import { Fragment } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import type { MessageSegment } from "@/lib/task-message-variables";

interface TaskMessageProps {
  segments: MessageSegment[];
}

// Renders a task message whose {variables} have been resolved into segments.
// Plain text renders inline; a group task's "anchor +N others" segments
// become hover chips that reveal everyone. Inline only, so callers control
// the wrapping <p> (line clamp, pre-wrap, etc.).
export function TaskMessage({ segments }: TaskMessageProps) {
  return (
    <>
      {segments.map((segment, i) =>
        segment.kind === "chip" ? (
          <Tooltip key={i} label={segment.tooltip}>
            {segment.text}
          </Tooltip>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
