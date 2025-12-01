const TypingIndicator: React.FC = () => {
  return (
    <div className="flex">
      {/* <img
        src="https://avatar.iran.liara.run/public"
        alt="User"
        className="object-cover mr-2 rounded-full size-8"
      /> */}
      <div className="flex items-center p-3 bg-white rounded-2xl">
        <div
          className="mr-1 bg-gray-400 rounded-full size-2 animate-pulse"
          style={{ animationDelay: "0s" }}
        ></div>
        <div
          className="mr-1 bg-gray-400 rounded-full size-2 animate-pulse"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="bg-gray-400 rounded-full size-2 animate-pulse"
          style={{ animationDelay: "0.4s" }}
        ></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
