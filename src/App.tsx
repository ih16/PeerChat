import { BrowserRouter, Route, Routes } from "react-router-dom";
import Intro from "./features/Intro";
import Host from "./features/Host";
import Client from "./features/Client";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/host" element={<Host />} />
          <Route path="/connect" element={<Client />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
