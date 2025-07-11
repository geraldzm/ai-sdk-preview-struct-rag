"use client";

import { Input } from "@/components/ui/input";
import { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { Options } from "react-markdown";
import React from "react";
import ProjectOverview from "@/components/project-overview";
import { ChevronDownIcon, LoadingIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    onError: (error) => {
      console.error(error);
      toast.error("You've been rate limited, please try again later!");
    },
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (messages.length > 0) setIsExpanded(true);

    console.log("messages", messages.length);

    messages.forEach((message) => {
      console.log(message.id, message);
    });
  }, [messages]);

  const lastUserMessage: UIMessage | undefined = messages
    .filter((m) => m.role === "user")
    .slice(-1)[0];

  const lastAssistantMessage: UIMessage | undefined = messages
    .filter((m) => m.role !== "user")
    .slice(-1)[0];

  return (
    <div className="flex justify-center items-start sm:pt-16 min-h-screen w-full dark:bg-neutral-900 px-4 md:px-0 py-4">
      <div className="flex flex-col items-center w-full max-w-[500px]">
        <ProjectOverview />
        <motion.div
          animate={{
            minHeight: isExpanded ? 200 : 0,
            padding: isExpanded ? 12 : 0,
          }}
          transition={{
            type: "spring",
            bounce: 0.5,
          }}
          className={cn(
            "rounded-lg w-full ",
            isExpanded
              ? "bg-neutral-200 dark:bg-neutral-800"
              : "bg-transparent",
          )}
        >
          <div className="flex flex-col w-full justify-between gap-2">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                className={`bg-neutral-100 text-base w-full text-neutral-700 dark:bg-neutral-700 dark:placeholder:text-neutral-400 dark:text-neutral-300`}
                minLength={3}
                required
                value={input}
                placeholder={"Ask me anything..."}
                disabled={status !== "ready" && status !== "error"}
                onChange={handleInputChange}
              />
            </form>
            <motion.div
              transition={{
                type: "spring",
              }}
              className="min-h-fit flex flex-col gap-2"
            >
              <AnimatePresence>
                <div className="px-2 min-h-12">
                  <div className="dark:text-neutral-400 text-neutral-500 text-sm w-fit mb-1">
                    {lastUserMessage?.content}
                  </div>
                  {status === "streaming" && <Loading />}
                  {status === "ready" && lastAssistantMessage && (
                    <Message message={lastAssistantMessage} />
                  )}
                </div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const Message = ({ message }: { message: UIMessage }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: "0.5rem",
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col gap-3 font-mono anti text-sm text-neutral-800 dark:text-neutral-200"
        id="markdown"
      >
        {message.parts?.map((part, index) => {
          const { type } = part;
          const key = `message-${message.id}-part-${index}`;

          if (type === "text") {
            return (
              <MemoizedReactMarkdown
                key={key}
                className={"max-h-72 overflow-y-scroll no-scrollbar-gutter"}
              >
                {part.text}
              </MemoizedReactMarkdown>
            );
          }

          if (type === "tool-invocation") {
            const { toolInvocation } = part;

            if (toolInvocation.state === "result") {
              return (
                <div key={toolInvocation.toolCallId}>
                  <div className="flex flex-row gap-2 items-center">
                    <div className="font-medium">tool result</div>
                    <button
                      data-testid="message-reasoning-toggle"
                      type="button"
                      className="cursor-pointer"
                      onClick={() => {
                        setIsExpanded(!isExpanded);
                      }}
                    >
                      <ChevronDownIcon />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        data-testid="message-reasoning"
                        key="content"
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        variants={variants}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                        className="pl-4 text-zinc-600 dark:text-zinc-400 border-l flex flex-col gap-4"
                      >
                        <MemoizedReactMarkdown
                          className={
                            "max-h-72 overflow-y-scroll no-scrollbar-gutter"
                          }
                        >
                          {toolInvocation.result}
                        </MemoizedReactMarkdown>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
          }
        })}
      </motion.div>
    </AnimatePresence>
  );
};

const Loading = () => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring" }}
        className="overflow-hidden flex justify-start items-center"
      >
        <div className="flex flex-row gap-2 items-center">
          <div className="animate-spin dark:text-neutral-400 text-neutral-500">
            <LoadingIcon />
          </div>
          <div className="text-neutral-500 dark:text-neutral-400 text-sm">
            Thinking...
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);
