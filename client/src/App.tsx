import { BrowserRouter, Route, Routes } from "react-router";
import Landing from "./pages/Landing";
import Room from "./pages/Room";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:id" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
