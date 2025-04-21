import React, { useRef, useEffect } from "react";
import formatTimestamp from "../utils/formatTimestamp";
import imageDefault from "../assets/default.jpg";
import { RiSendPlaneFill } from "react-icons/ri";

const MessageList = ({
  messages,
  senderEmail,
  scrollRef,
  sendMessageText,
  setSendMessageText,
  handleSendMessage,
}) => {
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);

  return (
    <main className="custom-scrollbar relative h-full w-[100%] flex flex-col justify-between">
      <section className="px-3 pt-5">
        <div
          ref={scrollRef}
          className="overflow-auto h-[80vh] custom-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          {messages?.map((msg, index) => (
            <div key={index}>
              {msg?.sender === senderEmail ? (
                <div
                  key={index}
                  className="flex flex-col items-end justify-end w-full"
                >
                  <div className="flex justify-end gap-1 w-[70%] h-auto text-sx text-left">
                    <div>
                      <div className="bg-white flex justify-end px-4 py-2 rounded-lg shadow-sm break-all break-words whitespace-pre-wrap max-w-[75vw]">
                        <p className="text-sx text-[#2A3D39] leading-relaxed tex">
                          {msg.text}
                        </p>
                      </div>
                      <p className="text-gray-400 text-xs text-right mt-3">
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start w-full">
                  <span className="flex gap-1 w-[70%] h-auto text-sx text-right">
                    <img
                      src={imageDefault}
                      alt="defaultImage"
                      className="h-11 w-11 object-cover rounded-full"
                    />
                    <div>
                      <div className="bg-white px-4 py-2 rounded-lg break-all shadow-sm break-words whitespace-pre-wrap max-w-[75vw] text-left">
                        <p className="text-sx text-[#2A3D39] leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                      <p className="text-gray-400 text-xs text-left mt-1">
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      <div className="sticky lg:bottom-0 bottom-[20px] p-3 h-fit w-full">
        <div>
          <form
            onSubmit={handleSendMessage}
            className="flex items-center bg-white h-[45px] w-full px-2 rounded-lg relative shadow-lg"
          >
            <input
              type="text"
              value={sendMessageText}
              onChange={(e) => setSendMessageText(e.target.value)}
              placeholder="Write your message"
              className="h-full text-[#2A3D39] outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-[100%]"
            />
            <button
              type="submit"
              className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3]"
            >
              <RiSendPlaneFill color="#01AA85" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default MessageList;
