import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import Notepad from "./NotePad";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/react-alert-dialog";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const clearUI = () => {
    const event = new CustomEvent("clearUI");
    window.dispatchEvent(event);
  };

  useEffect(() => {
    if (location.pathname === "/") {
      const randomPath = Math.random().toString(36).substring(2, 8);
      navigate(`/${randomPath}`);
    }
  }, [location, navigate]);

  const handleNewNote = () => {
    const newPath = Math.random().toString(36).substring(2, 8);
    clearUI();
    navigate(`/${newPath}`);
  };

  return (
    <div>
      <Routes>
        <Route path="/:noteId" element={<Notepad />} />
      </Routes>
      <AlertDialog>
        <AlertDialogTrigger className="absolute  left-auto sm:left-4 lg:left-[260px] z-20 right-4 w-fit top-1.5 sm:top-[50px] md:top-[56px] lg:top-7 text-sm bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1.5 lg:py-2 rounded-sm">
          <span className="hi3dden sm:block">Create New Note</span>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-gray-500 bg-black  w-[calc(100%-16px)] sm:w-full rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Are You Sure You Want To Create New Personal Note?
            </AlertDialogTitle>
            <AlertDialogDescription></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className=" hover:bg-white/10 border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNewNote}
              className=" bg-white/30 hover:bg-white/20 min-w-[80px]"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
