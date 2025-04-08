// src/components/ChatBubble.jsx
import React from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

function getStyle(type) {
  switch (type) {
    case "success":
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
        Icon: CheckCircleIcon,
      };
    case "error":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
        Icon: ExclamationCircleIcon,
      };
    default:
      return {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
        Icon: InformationCircleIcon,
      };
  }
}

const ChatBubble = ({ message, type = "info", time }) => {
  const { bg, text, border, Icon } = getStyle(type);

  return (
    <div
      className={`relative max-w-[80%] p-4 mb-3 border rounded-lg shadow-sm ${bg} ${text} ${border}`}
    >
      <div className="flex items-start space-x-2">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col">
          <p className="text-sm leading-snug">{message}</p>
          <div className="flex items-center mt-1 text-xs text-slate-500">
            <ClockIcon className="w-3 h-3 mr-1" />
            {time}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
