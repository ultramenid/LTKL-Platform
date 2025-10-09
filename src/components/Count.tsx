import React from "react";  
import { useCountStore } from "../store/counStore";

const Count: React.FC = () => {
  const { count, increment, decrement } = useCountStore();

  return (
    <div className="flex flex-col items-center space-y-4">
      <h1 className="text-2xl font-bold text-white">Count: {count}</h1>
      <div className="space-x-4">
        <button
          onClick={increment}
          className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Increment
        </button>
        <button
          onClick={decrement}
          className="cursor-pointer px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}

export default Count;