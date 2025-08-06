import React, { useContext } from "react";
import GenaiStatusContext from "./GenaiProvider";

const useGenaiStatus = () => {
  return useContext(GenaiStatusContext); // Use the correct context
};

export default useGenaiStatus;