
import { Outlet } from "react-router-dom";
import MobileNavbar from "./MobileNavbar";

const Layout = () => {
  return (
    <div className="app-container">
      <div className="flex-grow">
        <Outlet />
      </div>
      <MobileNavbar />
    </div>
  );
};

export default Layout;
