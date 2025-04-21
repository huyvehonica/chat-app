import { useMediaQuery } from "react-responsive";

const useResponsiveView = () => {
  const isMobileView = useMediaQuery({ maxWidth: 1024 });
  return isMobileView;
};

export default useResponsiveView;
